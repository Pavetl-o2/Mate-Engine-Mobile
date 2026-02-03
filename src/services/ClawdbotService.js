/**
 * Clawdbot Service for Mobile
 * Handles communication with Clawdbot server, Deepgram STT, ElevenLabs TTS, and Cartesia TTS
 */

class ClawdbotService {
  constructor() {
    this.serverUrl = '';
    this.authToken = '';
    this.sessionId = 'mobile-main';
    this.deepgramApiKey = '';
    this.elevenLabsApiKey = '';
    this.elevenLabsVoiceId = 'k9294w367tNmQIywtFJI';
    this.cartesiaApiKey = '';
    this.cartesiaVoiceId = '5ae6768d-7263-4c26-8d3a-a22976c534df';
    this.timeout = 60000;
  }

  configure(config) {
    if (config.serverUrl) this.serverUrl = config.serverUrl;
    if (config.authToken) this.authToken = config.authToken;
    if (config.sessionId) this.sessionId = config.sessionId;
    if (config.deepgramApiKey) this.deepgramApiKey = config.deepgramApiKey;
    if (config.elevenLabsApiKey) this.elevenLabsApiKey = config.elevenLabsApiKey;
    if (config.elevenLabsVoiceId) this.elevenLabsVoiceId = config.elevenLabsVoiceId;
    if (config.cartesiaApiKey) this.cartesiaApiKey = config.cartesiaApiKey;
    if (config.cartesiaVoiceId) this.cartesiaVoiceId = config.cartesiaVoiceId;
  }

  getConfig() {
    return {
      serverUrl: this.serverUrl,
      sessionId: this.sessionId,
      hasAuthToken: !!this.authToken,
      hasDeepgramKey: !!this.deepgramApiKey,
      hasElevenLabsKey: !!this.elevenLabsApiKey,
      hasCartesiaKey: !!this.cartesiaApiKey,
      elevenLabsVoiceId: this.elevenLabsVoiceId,
      cartesiaVoiceId: this.cartesiaVoiceId
    };
  }

  async healthCheck() {
    if (!this.serverUrl) {
      return { ok: false, error: 'Server URL not configured' };
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${this.serverUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        return { ok: data.status === 'ok', clawdbot: data.clawdbot };
      }
      return { ok: false, error: 'Server error' };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async chat(message, sessionId = null) {
    if (!this.serverUrl) {
      return { ok: false, error: 'Server URL not configured' };
    }
    if (!message || message.trim() === '') {
      return { ok: false, error: 'Message cannot be empty' };
    }
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;
      const response = await fetch(`${this.serverUrl}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, sessionId: sessionId || this.sessionId })
      });
      const data = await response.json();
      if (data.success) {
        return { ok: true, response: data.response, sessionId: data.sessionId };
      } else {
        return { ok: false, error: data.error || 'Unknown error' };
      }
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async chatWithFile(message, fileUri, fileName, fileType) {
    if (!this.serverUrl) {
      return { ok: false, error: 'Server URL not configured' };
    }
    try {
      const fileDescription = `[Archivo adjunto: ${fileName} (${fileType})]`;
      const fullMessage = message ? `${message}\n\n${fileDescription}` : fileDescription;
      return await this.chat(fullMessage);
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async speechToText(audioUri) {
    if (!this.deepgramApiKey) {
      return { ok: false, error: 'Deepgram API key not configured' };
    }
    try {
      const response = await fetch(audioUri);
      const audioBlob = await response.blob();
      const deepgramResponse = await fetch(
        'https://api.deepgram.com/v1/listen?model=nova-2&language=es',
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${this.deepgramApiKey}`,
            'Content-Type': 'audio/wav'
          },
          body: audioBlob
        }
      );
      const data = await deepgramResponse.json();
      const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      return { ok: true, text: transcript || '' };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async textToSpeech(text) {
    if (!this.elevenLabsApiKey) {
      return { ok: false, error: 'ElevenLabs API key not configured' };
    }
    if (!text || text.trim() === '') {
      return { ok: false, error: 'Text cannot be empty' };
    }
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsApiKey
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          })
        }
      );
      if (response.ok) {
        const audioBlob = await response.blob();
        return { ok: true, audioBlob };
      } else {
        return { ok: false, error: 'ElevenLabs error' };
      }
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Text to speech using Cartesia HTTP API (más confiable que WebSocket en React Native)
   * Endpoint: /tts/bytes con sonic-turbo
   */
  async textToSpeechCartesia(text) {
    if (!this.cartesiaApiKey) {
      return { ok: false, error: 'Cartesia API key not configured' };
    }
    if (!text || text.trim() === '') {
      return { ok: false, error: 'Text cannot be empty' };
    }

    try {
      console.log('Calling Cartesia TTS API...');
      const startTime = Date.now();
      
      const response = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'Cartesia-Version': '2025-04-16',
          'X-API-Key': this.cartesiaApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model_id: 'sonic-turbo',
          transcript: text,
          voice: {
            mode: 'id',
            id: this.cartesiaVoiceId
          },
          output_format: {
            container: 'mp3',
            encoding: 'mp3',
            sample_rate: 44100  // Estándar para evitar velocidad alterada
          }
        })
      });

      const latency = Date.now() - startTime;
      console.log(`Cartesia TTS latency: ${latency}ms`);

      if (response.ok) {
        const audioBlob = await response.blob();
        console.log(`Audio received: ${audioBlob.size} bytes`);
        return { ok: true, audioBlob, latency };
      } else {
        const errorText = await response.text();
        console.error('Cartesia error:', errorText);
        return { ok: false, error: `Cartesia error: ${response.status}` };
      }
    } catch (error) {
      console.error('Cartesia TTS error:', error);
      return { ok: false, error: error.message };
    }
  }

  async processVoice(audioUri, sessionId = null) {
    const sttResult = await this.speechToText(audioUri);
    if (!sttResult.ok) {
      return { ok: false, error: `STT failed: ${sttResult.error}` };
    }
    if (!sttResult.text) {
      return { ok: false, error: 'No speech detected' };
    }
    const chatResult = await this.chat(sttResult.text, sessionId);
    if (!chatResult.ok) {
      return { ok: false, error: `Chat failed: ${chatResult.error}` };
    }
    let ttsResult;
    if (this.cartesiaApiKey) {
      ttsResult = await this.textToSpeechCartesia(chatResult.response);
    } else {
      ttsResult = await this.textToSpeech(chatResult.response);
    }
    return {
      ok: true,
      transcription: sttResult.text,
      response: chatResult.response,
      audioBlob: ttsResult.ok ? ttsResult.audioBlob : null
    };
  }

  async resetSession(sessionId = null) {
    if (!this.serverUrl) {
      return { ok: false, error: 'Server URL not configured' };
    }
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;
      const response = await fetch(`${this.serverUrl}/session/reset`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId: sessionId || this.sessionId })
      });
      return { ok: response.ok };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
}

export const clawdbotService = new ClawdbotService();
export default ClawdbotService;
