// 语音报价 - Web Speech API
(function (global) {
  const Speech = {
    speak(text) {
      try {
        if (!('speechSynthesis' in window)) {
          console.warn('当前环境不支持语音合成');
          return false;
        }
        // 取消之前的播报
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN';
        u.rate = 1.0;
        u.pitch = 1.0;
        u.volume = 1.0;
        // 尝试选择中文语音
        const voices = window.speechSynthesis.getVoices();
        const cn = voices.find(v => /zh|cmn/i.test(v.lang) || /Chinese|Chinese/i.test(v.name));
        if (cn) u.voice = cn;
        window.speechSynthesis.speak(u);
        return true;
      } catch (e) {
        console.warn('语音播报失败', e);
        return false;
      }
    },
    stop() {
      try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
    },
  };

  // 某些浏览器 voice 列表是异步加载,提前触发一次
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  global.Speech = Speech;
})(window);
