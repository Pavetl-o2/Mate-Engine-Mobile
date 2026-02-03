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

  /**
   * Chat with streaming support - calls onChunk callback as text arrives
   */
  async chat(message, sessionId = null, onChunk = null) {
    if (!this.serverUrl) {
      return { ok: false, error: 'Server URL not configured' };
    }
    if (!message || message.trim() === '') {
      return { ok: false, error: 'Message cannot be empty' };
    }

    const startTime = Date.now();
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;
      
      const response = await fetch(`${this.serverUrl}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          message, 
          sessionId: sessionId || this.sessionId,
          stream: !!onChunk // Request streaming if callback provided
        })
      });

      const latency = Date.now() - startTime;
      console.log(`Chat API latency: ${latency}ms`);

      // If streaming requested and server supports it
      if (onChunk && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          onChunk(chunk, fullText);
        }

        return { ok: true, response: fullText, sessionId: this.sessionId, latency };
      }

      // Non-streaming fallback
      const data = await response.json();
      if (data.success) {
        return { ok: true, response: data.response, sessionId: data.sessionId, latency };
      } else {
        return { ok: false, error: data.error || 'Unknown error' };
      }
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async chatWithFile(message, fileUri, fileName, fileType, onChunk = null) {
    if (!this.serverUrl) {
      return { ok: false, error: 'Server URL not configured' };
    }
    try {
      const fileDescription = `[Archivo adjunto: ${fileName} (${fileType})]`;
      const fullMessage = message ? `${message}\n\n${fileDescription}` : fileDescription;
      return await this.chat(fullMessage, null, onChunk);
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
   * Text to speech using Cartesia HTTP API with streaming support
   * Endpoint: /tts/bytes con sonic-turbo
   */
  async textToSpeechCartesia(text, onProgress = null) {
    if (!this.cartesiaApiKey) {
      return { ok: false, error: 'Cartesia API key not configured' };
    }
    if (!text || text.trim() === '') {
      return { ok: false, error: 'Text cannot be empty' };
    }

    try {
      console.log('Calling Cartesia TTS API...');
      const startTime = Date.now();
      
      if (onProgress) onProgress('connecting');
      
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
            sample_rate: 44100
          }
        })
      });

      if (onProgress) onProgress('receiving');

      const latency = Date.now() - startTime;
      console.log(`Cartesia TTS latency: ${latency}ms`);

      if (response.ok) {
        const audioBlob = await response.blob();
        console.log(`Audio received: ${audioBlob.size} bytes`);
        if (onProgress) onProgress('complete');
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

  /**
   * Stream text character by character with configurable speed
   */
  streamText(text, onChar, options = {}) {
    const { 
      charDelay = 15,        // ms between characters
      wordDelay = 30,        // ms between words (extra pause)
      sentenceDelay = 80     // ms at end of sentences
    } = options;
    
    return new Promise((resolve) => {
      let index = 0;
      let currentText = '';
      
      const streamNext = () => {
        if (index >= text.length) {
          resolve(currentText);
          return;
        }
        
        const char = text[index];
        currentText += char;
        onChar(char, currentText);
        
        index++;
        
        // Calculate delay based on character
        let delay = charDelay;
        if (char === ' ') delay = wordDelay;
        if ('.!?'.includes(char)) delay = sentenceDelay;
        
        setTimeout(streamNext, delay);
      };
      
      streamNext();
    });
  }

  async processVoice(audioUri, sessionId = null, onProgress = null) {
    if (onProgress) onProgress('transcribing');
    
    const sttResult = await this.speechToText(audioUri);
    if (!sttResult.ok) {
      return { ok: false, error: `STT failed: ${sttResult.error}` };
    }
    if (!sttResult.text) {
      return { ok: false, error: 'No speech detected' };
    }
    
    if (onProgress) onProgress('thinking');
    
    const chatResult = await this.chat(sttResult.text, sessionId);
    if (!chatResult.ok) {
      return { ok: false, error: `Chat failed: ${chatResult.error}` };
    }
    
    if (onProgress) onProgress('speaking');
    
    let ttsResult;
    if (this.cartesiaApiKey) {
      ttsResult = await this.textToSpeechCartesia(chatResult.response, onProgress);
    } else {
      ttsResult = await this.textToSpeech(chatResult.response);
    }
    
    return {
      ok: true,
      transcription: sttResult.text,
      response: chatResult.response,
      audioBlob: ttsResult.ok ? ttsResult.audioBlob : null,
      latency: chatResult.latency
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
