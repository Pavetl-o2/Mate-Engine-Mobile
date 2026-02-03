/**
 * Avatar3DRenderer - Three.js puro con modelo desde GitHub
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// URL del modelo desde GitHub (raw)
const MODEL_URL = 'https://raw.githubusercontent.com/Pavetl-o2/Mate-Engine-Mobile/claude/fix-3d-model-loading-PTbRl/assets/models/avatar.glb';

const getHtmlContent = () => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Jinx 3D</title>
    <style>
        body { 
            margin: 0; 
            overflow: hidden; 
            background: #0f1923; 
            touch-action: none;
        }
        #loading { 
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            color: #6c63ff; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px; 
            text-align: center;
            z-index: 100;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(108, 99, 255, 0.3);
            border-top-color: #6c63ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        #error {
            display: none;
            color: #ff6b6b;
            text-align: center;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div id="loading">
        <div class="spinner"></div>
        <div id="loadingText">Cargando Jinx...</div>
    </div>
    <div id="error"></div>

    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
    }
    </script>

    <script type="module">
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

        const loadingEl = document.getElementById('loading');
        const loadingText = document.getElementById('loadingText');
        const errorEl = document.getElementById('error');

        function showError(msg) {
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
            errorEl.innerHTML = '<h3>Error</h3><p>' + msg + '</p>';
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', msg: msg}));
            }
        }

        try {
            console.log('Iniciando Three.js...');
            loadingText.textContent = 'Iniciando...';
            
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x2a3a4d);  // Fondo más claro para mejor contraste

            console.log('Creando renderer...');
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0;
            document.body.appendChild(renderer.domElement);

            console.log('Creando cámara...');
            const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.01, 100);
            camera.position.set(0, 0.5, 3.5);  // Cámara a la altura del centro del modelo

            console.log('Creando controles (SIN auto-rotación)...');
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.target.set(0, -0.2, 0);  // Apuntar un poco más abajo del centro
            controls.enableDamping = true;
            controls.autoRotate = false;  // SIN ROTACIÓN AUTOMÁTICA
            controls.minDistance = 2;
            controls.maxDistance = 6;
            // controls.maxPolarAngle = Math.PI / 2;  // Permitir ver desde cualquier ángulo

            console.log('Agregando luces...');
            scene.add(new THREE.AmbientLight(0xffffff, 0.6));
            
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
            dirLight.position.set(2, 3, 4);
            scene.add(dirLight);

            const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
            fillLight.position.set(-2, 1, -1);
            scene.add(fillLight);

            const rimLight = new THREE.DirectionalLight(0x6c63ff, 0.3);
            rimLight.position.set(0, 2, -3);
            scene.add(rimLight);

            console.log('Cargando modelo desde:', '${MODEL_URL}');
            loadingText.textContent = 'Descargando modelo...';

            const loader = new GLTFLoader();
            
            loader.load(
                '${MODEL_URL}',
                (gltf) => {
                    console.log('¡Modelo cargado exitosamente!');
                    loadingText.textContent = 'Procesando modelo...';
                    
                    const model = gltf.scene;
                    
                    // Habilitar sombras
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    // Centrar y escalar
                    const box = new THREE.Box3().setFromObject(model);
                    const size = box.getSize(new THREE.Vector3());
                    const center = box.getCenter(new THREE.Vector3());
                    
                    console.log('Tamaño del modelo:', size);
                    console.log('Centro del modelo:', center);
                    
                    const targetHeight = 0.96;  // Modelo 20% más pequeño (1.2 * 0.8)
                    const scale = targetHeight / size.y;
                    model.scale.setScalar(scale);
                    
                    // Centrar y ajustar posición
                    model.position.x = -center.x * scale;
                    model.position.y = -center.y * scale - 0.5;  // Bajar 20% más el modelo
                    model.position.z = -center.z * scale;
                    
                    scene.add(model);

                    // Animaciones
                    let mixer = null;
                    let animations = [];
                    
                    if (gltf.animations && gltf.animations.length > 0) {
                        console.log('Animaciones encontradas:', gltf.animations.map(a => a.name));
                        animations = gltf.animations;
                        mixer = new THREE.AnimationMixer(model);
                        
                        // Buscar animación idle, o usar la primera
                        const idleAnim = gltf.animations.find(a => 
                            a.name.toLowerCase().includes('idle')
                        ) || gltf.animations[0];
                        
                        const action = mixer.clipAction(idleAnim);
                        action.play();
                        console.log('Reproduciendo animación:', idleAnim.name);
                    } else {
                        console.log('No se encontraron animaciones');
                    }

                    // Ocultar loading
                    loadingEl.style.display = 'none';
                    
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'loaded',
                            animations: animations.map(a => a.name)
                        }));
                    }

                    // Loop de animación
                    const clock = new THREE.Clock();
                    function animate() {
                        requestAnimationFrame(animate);
                        
                        const delta = clock.getDelta();
                        if (mixer) mixer.update(delta);
                        
                        controls.update();
                        renderer.render(scene, camera);
                    }
                    animate();
                },
                (progress) => {
                    const loadedMB = (progress.loaded / 1024 / 1024).toFixed(1);
                    if (progress.total) {
                        const totalMB = (progress.total / 1024 / 1024).toFixed(1);
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        loadingText.textContent = percent + '% (' + loadedMB + '/' + totalMB + ' MB)';
                    } else {
                        loadingText.textContent = 'Descargado: ' + loadedMB + ' MB';
                    }
                },
                (error) => {
                    console.error('Error cargando modelo:', error);
                    showError('Error: ' + error.message);
                }
            );

            // Handle resize
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });

            // Comandos desde React Native
            window.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'toggle-animation' && mixer) {
                        // Pausar/reanudar animación
                    }
                } catch (e) {}
            });

        } catch (e) {
            console.error('Error de inicialización:', e);
            showError('Error: ' + e.message);
        }
    </script>
</body>
</html>
`;

export default function Avatar3DRenderer({ style }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const webViewRef = useRef(null);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView:', data);
      if (data.type === 'loaded') {
        setLoaded(true);
      } else if (data.type === 'error') {
        setError(true);
        setErrorMsg(data.msg);
      }
    } catch (e) {
      if (event.nativeEvent.data === 'loaded') {
        setLoaded(true);
      }
    }
  };

  if (error) {
    return (
      <View style={[styles.container, style, styles.center]}>
        <Ionicons name="alert-circle" size={60} color="#ff6b6b" />
        <Text style={styles.errorTitle}>Error al cargar</Text>
        <Text style={styles.errorText}>{errorMsg || 'No se pudo cargar el modelo'}</Text>
        <Text style={styles.hint}>
          El modelo puede tener formato incompatible{'\n'}
          (requiere texturas KTX2)
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: getHtmlContent() }}
        style={styles.webView}
        originWhitelist={['*']}
        mixedContentMode="always"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        onMessage={handleMessage}
        onError={() => setError(true)}
      />
      
      {!loaded && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#6c63ff" />
          <Text style={styles.text}>Cargando Jinx...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: '#0f1923',
  },
  webView: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f1923',
  },
  text: {
    color: '#6c63ff',
    marginTop: 10,
    fontSize: 14,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#ff6b6b',
    fontSize: 18,
    marginTop: 10,
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  hint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 20,
    textAlign: 'center',
  },
});
