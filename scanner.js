// 扫码模块 - 优先使用 BarcodeDetector;不支持则降级为提示
(function (global) {
  const supported = 'BarcodeDetector' in window;
  const FORMATS = ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'];

  class Scanner {
    constructor(videoEl, { onDetect, onError } = {}) {
      this.video = videoEl;
      this.stream = null;
      this.running = false;
      this.onDetect = onDetect || (() => {});
      this.onError = onError || (() => {});
      this._rafId = null;
      this._detector = null;
      this._lastValue = '';
      this._lastTime = 0;
    }

    static isSupported() { return supported; }

    async start() {
      if (this.running) return;
      if (!supported) {
        this.onError('当前浏览器不支持扫码,请使用 Chrome / Edge / 安卓 WebView,或手动输入条码');
        return;
      }
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        this.video.srcObject = this.stream;
        await this.video.play();
        this._detector = new window.BarcodeDetector({ formats: FORMATS });
        this.running = true;
        this._loop();
      } catch (e) {
        this.onError('无法访问摄像头:' + (e.message || e.name));
      }
    }

    stop() {
      this.running = false;
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = null;
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
      }
      this.video.srcObject = null;
    }

    _loop() {
      if (!this.running) return;
      this._rafId = requestAnimationFrame(async () => {
        try {
          const codes = await this._detector.detect(this.video);
          if (codes && codes.length) {
            const value = codes[0].rawValue;
            const now = Date.now();
            // 简单防抖:相同条码 1.5s 内不重复触发
            if (value === this._lastValue && now - this._lastTime < 1500) {
              this._loop();
              return;
            }
            this._lastValue = value;
            this._lastTime = now;
            this.running = false;
            this.onDetect(value);
            return;
          }
        } catch (e) {
          // 单帧失败忽略
        }
        this._loop();
      });
    }
  }

  global.Scanner = Scanner;
})(window);
