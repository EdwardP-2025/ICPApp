// Essential polyfills for React Native
console.log('Loading polyfills...');

// TextEncoder polyfill
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('text-encoding').TextEncoder;
}

// TextDecoder polyfill
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('text-encoding').TextDecoder;
}

// Buffer polyfill
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Crypto polyfill
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (array) => {
      const bytes = new Uint8Array(array.length);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      array.set(bytes);
      return array;
    }
  };
}

// Process polyfill
if (typeof global.process === 'undefined') {
  global.process = {
    env: {},
    nextTick: (callback) => setTimeout(callback, 0),
  };
}

// setImmediate polyfill
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (callback) => setTimeout(callback, 0);
}

// clearImmediate polyfill
if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (id) => clearTimeout(id);
}

// URLSearchParams polyfill
if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = class URLSearchParams {
    constructor(init) {
      this._params = new Map();
      if (init) {
        if (typeof init === 'string') {
          this._parseString(init);
        } else if (init instanceof URLSearchParams) {
          for (const [key, value] of init._params) {
            this._params.set(key, value);
          }
        }
      }
    }
    
    _parseString(str) {
      const pairs = str.split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key) {
          this._params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
        }
      }
    }
    
    get(name) {
      return this._params.get(name) || null;
    }
    
    set(name, value) {
      this._params.set(name, value);
    }
    
    append(name, value) {
      this._params.set(name, value);
    }
    
    delete(name) {
      this._params.delete(name);
    }
    
    has(name) {
      return this._params.has(name);
    }
    
    toString() {
      const pairs = [];
      for (const [key, value] of this._params) {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
      return pairs.join('&');
    }
  };
}

// URL polyfill with hostname support for Hermes
if (typeof global.URL === 'undefined') {
  global.URL = class URL {
    constructor(url, base) {
      this._url = url;
      this._base = base;
      this._href = this._resolveUrl(url, base);
    }
    
    get href() {
      return this._href;
    }
    
    get hostname() {
      try {
        let hostname = this._href.replace(/^https?:\/\//, '');
        hostname = hostname.split('/')[0];
        hostname = hostname.split(':')[0];
        return hostname;
      } catch (error) {
        return '';
      }
    }
    
    get host() {
      try {
        let host = this._href.replace(/^https?:\/\//, '');
        host = host.split('/')[0];
        return host;
      } catch (error) {
        return '';
      }
    }
    
    get protocol() {
      if (this._href.startsWith('https://')) {
        return 'https:';
      } else if (this._href.startsWith('http://')) {
        return 'http:';
      }
      return 'https:';
    }
    
    get port() {
      try {
        const host = this.host;
        const parts = host.split(':');
        return parts.length > 1 ? parts[1] : '';
      } catch (error) {
        return '';
      }
    }
    
    _resolveUrl(url, base) {
      if (base) {
        return new URL(url, base).href;
      }
      return url;
    }
  };
} else {
  // Fix URL.hostname for existing URL implementation in Hermes
  const OriginalURL = global.URL;
  global.URL = class ExtendedURL extends OriginalURL {
    constructor(url, base) {
      super(url, base);
    }
    
    get hostname() {
      try {
        let hostname = this.href.replace(/^https?:\/\//, '');
        hostname = hostname.split('/')[0];
        hostname = hostname.split(':')[0];
        return hostname;
      } catch (error) {
        return '';
      }
    }
  };
}

// Fetch polyfill - ensure it's available
if (typeof global.fetch === 'undefined') {
  global.fetch = require('react-native').fetch;
}

// btoa polyfill (Base64 encoding)
if (typeof global.btoa === 'undefined') {
  global.btoa = function(str) {
    try {
      return Buffer.from(str, 'binary').toString('base64');
    } catch (e) {
      // Fallback for React Native
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let output = '';
      const bytes = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
      }
      
      let byteNum;
      let chunk;
      
      for (let i = 0; i < bytes.length; i += 3) {
        byteNum = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        chunk = [
          chars[(byteNum >> 18) & 0x3F],
          chars[(byteNum >> 12) & 0x3F],
          chars[(byteNum >> 6) & 0x3F],
          chars[byteNum & 0x3F]
        ];
        output += chunk.join('');
      }
      
      return output;
    }
  };
}

// atob polyfill (Base64 decoding)
if (typeof global.atob === 'undefined') {
  global.atob = function(str) {
    try {
      return Buffer.from(str, 'base64').toString('binary');
    } catch (e) {
      // Fallback for React Native
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let output = '';
      str = String(str).replace(/=+$/, '');
      
      if (str.length % 4 === 1) {
        throw new Error('Invalid string');
      }
      
      let byteNum;
      let chunk;
      
      for (let i = 0; i < str.length; i += 4) {
        chunk = [
          chars.indexOf(str.charAt(i)),
          chars.indexOf(str.charAt(i + 1)),
          chars.indexOf(str.charAt(i + 2)),
          chars.indexOf(str.charAt(i + 3))
        ];
        
        byteNum = (chunk[0] << 18) | (chunk[1] << 12) | (chunk[2] << 6) | chunk[3];
        
        output += String.fromCharCode(
          (byteNum >> 16) & 0xFF,
          (byteNum >> 8) & 0xFF,
          byteNum & 0xFF
        );
      }
      
      return output;
    }
  };
}

console.log('✅ All polyfills loaded successfully');
