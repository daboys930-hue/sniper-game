// Voice Chat System for 3D Sniper Game
// Team-only voice chat with always-on (mutable) functionality

class VoiceChatSystem {
    constructor() {
        this.isMuted = false;
        this.isActive = false;
        this.mediaStream = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.processor = null;
        this.teamMembers = {}; // Track connected team members
        this.audioElements = {}; // HTML audio elements for each team member
        this.volumeLevel = 0;
        this.volumeThreshold = 0.02; // Threshold for voice activity detection
        this.initialized = false;
        
        // Initialize voice chat when page loads
        this.init();
    }

    async init() {
        try {
            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: false
                } 
            });

            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            // Create microphone source
            this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.microphone.connect(this.analyser);

            // Create script processor for audio analysis
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            this.analyser.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            // Handle audio processing
            this.processor.onaudioprocess = (e) => this.processAudio(e);

            this.initialized = true;
            this.updateVoiceUI();
            console.log('🎤 Voice chat system initialized successfully');
            
            // Simulate team voice connections (in real scenario, these would be WebRTC connections)
            this.simulateTeamConnections();
            
        } catch (error) {
            console.error('❌ Microphone access denied:', error);
            this.showMicrophoneError();
        }
    }

    processAudio(event) {
        if (this.isMuted || !this.initialized) return;

        const inputData = event.inputBuffer.getChannelData(0);
        let sum = 0;
        
        // Calculate RMS (Root Mean Square) for volume level
        for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
        }
        
        this.volumeLevel = Math.sqrt(sum / inputData.length);
        
        // Update voice activity detection
        this.isActive = this.volumeLevel > this.volumeThreshold;
        
        // Broadcast voice to team members (simulated)
        if (this.isActive) {
            this.broadcastVoiceToTeam(inputData);
        }
        
        this.updateVoiceUI();
    }

    broadcastVoiceToTeam(audioData) {
        // In a real implementation, this would send audio data via WebRTC to team members
        // For now, we simulate it by storing audio events
        if (!this.isActive) return;
        
        // Mock broadcast to team
        Object.keys(this.teamMembers).forEach(memberId => {
            const member = this.teamMembers[memberId];
            if (member && member.audioElement) {
                // In real implementation, update audio stream here
            }
        });
    }

    simulateTeamConnections() {
        // Simulate connections to other team members
        // In a real multiplayer game, this would connect via WebRTC
        const teamMemberIds = ['teammate-1', 'teammate-2'];
        
        teamMemberIds.forEach(id => {
            this.teamMembers[id] = {
                id: id,
                connected: true,
                audioElement: this.createAudioElement(id),
                isActive: false
            };
        });
    }

    createAudioElement(memberId) {
        const audio = new Audio();
        audio.id = `voice-${memberId}`;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        return audio;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            // Stop microphone input
            if (this.processor) {
                this.processor.disconnect();
            }
            console.log('🔇 Voice chat muted');
        } else {
            // Resume microphone input
            if (this.processor && this.audioContext) {
                this.analyser.connect(this.processor);
                this.processor.connect(this.audioContext.destination);
            }
            console.log('🔊 Voice chat unmuted');
        }
        
        this.updateVoiceUI();
    }

    updateVoiceUI() {
        const statusElement = document.getElementById('voiceStatusText');
        const indicator = document.getElementById('voiceIndicator');
        
        if (!this.initialized) {
            statusElement.innerHTML = '<span id="voiceMuted">VOICE: ERROR</span>';
            indicator.style.background = '#ffaa00';
            return;
        }
        
        if (this.isMuted) {
            statusElement.innerHTML = '<span id="voiceMuted">VOICE: MUTED (M)</span>';
            indicator.style.background = '#ff0000';
        } else if (this.isActive) {
            statusElement.innerHTML = '<span id="voiceActive">VOICE: TRANSMITTING (M)</span>';
            indicator.style.background = '#00ff00';
        } else {
            statusElement.innerHTML = 'VOICE: ACTIVE (M)';
            indicator.style.background = '#00ff00';
        }
    }

    showMicrophoneError() {
        const statusElement = document.getElementById('voiceStatusText');
        const indicator = document.getElementById('voiceIndicator');
        
        statusElement.innerHTML = '<span id="voiceMuted">VOICE: NO MIC</span>';
        indicator.style.background = '#ffaa00';
        
        console.warn('⚠️ Microphone not available. Voice chat disabled.');
    }

    getTeamMembers() {
        return Object.values(this.teamMembers);
    }

    isTeammateVoiceActive(memberId) {
        const member = this.teamMembers[memberId];
        return member ? member.isActive : false;
    }

    getVolumeLevel() {
        return this.volumeLevel;
    }

    isVoiceActive() {
        return this.isActive && !this.isMuted;
    }

    destroy() {
        if (this.processor) this.processor.disconnect();
        if (this.analyser) this.analyser.disconnect();
        if (this.microphone) this.microphone.disconnect();
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) this.audioContext.close();
    }
}

// Initialize voice chat system
let voiceChatSystem;

window.addEventListener('DOMContentLoaded', () => {
    voiceChatSystem = new VoiceChatSystem();
});

// Handle M key for mute toggle
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm' && voiceChatSystem) {
        e.preventDefault();
        voiceChatSystem.toggleMute();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (voiceChatSystem) {
        voiceChatSystem.destroy();
    }
});
