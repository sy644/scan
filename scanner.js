// 扫码模块 (ES5 兼容)
(function (global) {
  var supported = 'BarcodeDetector' in window;
  var FORMATS = ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'];

  function Scanner(videoEl, opts) {
    opts = opts || {};
    this.video = videoEl;
    this.stream = null;
    this.running = false;
    this.onDetect = opts.onDetect || function () {};
    this.onError = opts.onError || function () {};
    this._rafId = null;
    this._detector = null;
    this._lastValue = '';
    this._lastTime = 0;
  }

  Scanner.prototype.isSupported = function () { return supported; };

  Scanner.prototype.start = function () {
    var self = this;
    if (self.running) return;
    if (!supported) {
      self.onError('当前浏览器不支持扫码');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      self.onError('当前环境无法访问摄像头');
      return;
    }
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    }).then(function (stream) {
      self.stream = stream;
      self.video.srcObject = stream;
      return self.video.play();
    }).then(function () {
      try {
        self._detector = new window.BarcodeDetector({ formats: FORMATS });
      } catch (e) {
        self.onError('扫码初始化失败');
        return;
      }
      self.running = true;
      self._loop();
    }).catch(function (e) {
      self.onError('无法访问摄像头: ' + (e && e.message ? e.message : e));
    });
  };

  Scanner.prototype.stop = function () {
    this.running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
    if (this.stream) {
      try {
        var tracks = this.stream.getTracks();
        for (var i = 0; i < tracks.length; i++) tracks[i].stop();
      } catch (e) {}
      this.stream = null;
    }
    this.video.srcObject = null;
  };

  Scanner.prototype._loop = function () {
    var self = this;
    if (!self.running) return;
    self._rafId = requestAnimationFrame(function () {
      if (!self.running) return;
      if (!self._detector) { self._loop(); return; }
      self._detector.detect(self.video).then(function (codes) {
        if (!self.running) return;
        if (codes && codes.length) {
          var value = codes[0].rawValue;
          var now = Date.now();
          if (value === self._lastValue && now - self._lastTime < 1500) {
            self._loop();
            return;
          }
          self._lastValue = value;
          self._lastTime = now;
          self.running = false;
          self.onDetect(value);
          return;
        }
        self._loop();
      }).catch(function () {
        self._loop();
      });
    });
  };

  global.Scanner = Scanner;
  global.ScannerSupported = supported;
  global.Scanner.isSupported = function () { return supported; };
})(window);
