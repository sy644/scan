// 主应用 - 路由 + 视图逻辑
(function () {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ========== 视图切换 ==========
  const VIEWS = ['home', 'scan', 'detail', 'manage', 'form'];
  function showView(name) {
    VIEWS.forEach(v => {
      const el = document.querySelector(`[data-view="${v}"]`);
      if (el) el.hidden = (v !== name);
    });
    window.scrollTo(0, 0);
    // 离开扫码页时关闭
    if (name !== 'scan') stopScanCamera();
  }

  // ========== Toast ==========
  let toastTimer = null;
  function toast(msg, ms = 1800) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, ms);
  }

  // ========== 扫码实例 ==========
  let mainScanner = null;
  let modalScanner = null;
  function stopScanCamera() {
    if (mainScanner) { mainScanner.stop(); }
  }
  function stopModalScan() {
    if (modalScanner) { modalScanner.stop(); }
    $('#modal-scan').hidden = true;
  }

  // ========== 详情页倒计时 ==========
  let countdownTimer = null;
  let countdownRemain = 0;
  function startCountdown(sec = 4) {
    clearInterval(countdownTimer);
    countdownRemain = sec;
    const txt = $('#countdown-text');
    const tick = () => {
      countdownRemain -= 1;
      if (countdownRemain <= 0) {
        clearInterval(countdownTimer);
        showView('home');
      } else {
        txt.textContent = countdownRemain + '秒后自动返回首页';
      }
    };
    txt.textContent = sec + '秒后自动返回首页';
    countdownTimer = setInterval(tick, 1000);
  }
  function stopCountdown() {
    clearInterval(countdownTimer);
  }

  // ========== 渲染管理列表 ==========
  function renderManage() {
    const list = Storage.list();
    const wrap = $('#manage-list');
    const empty = $('#manage-empty');
    wrap.innerHTML = '';
    if (!list.length) {
      wrap.hidden = true;
      empty.hidden = false;
      return;
    }
    wrap.hidden = false;
    empty.hidden = true;
    list.forEach(p => {
      const el = document.createElement('div');
      el.className = 'manage-item';
      el.innerHTML = `
        <div class="manage-item-info">
          <div class="manage-item-name"></div>
          <div class="manage-item-barcode"></div>
        </div>
        <div class="manage-item-price">¥<span class="p-price"></span></div>
        <div class="manage-item-actions">
          <button class="ic-edit" aria-label="编辑">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 17.25V21h3.75l11-11.04-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button class="ic-delete" aria-label="删除">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-3h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1zM4 5h16v2H4z"/></svg>
          </button>
        </div>
      `;
      el.querySelector('.manage-item-name').textContent = p.name || '(未命名)';
      el.querySelector('.manage-item-barcode').textContent = p.barcode || '--';
      el.querySelector('.p-price').textContent = Number(p.price || 0).toFixed(2);
      el.querySelector('.ic-edit').addEventListener('click', () => openForm(p.id));
      el.querySelector('.ic-delete').addEventListener('click', () => {
        if (confirm('确定要删除「' + (p.name || p.barcode) + '」吗?')) {
          Storage.remove(p.id);
          renderManage();
          toast('已删除');
        }
      });
      // 点击整行可"扫码模拟查询"
      el.addEventListener('click', (e) => {
        if (e.target.closest('.ic-edit') || e.target.closest('.ic-delete')) return;
        showDetail(p);
      });
      wrap.appendChild(el);
    });
  }

  // ========== 显示详情 ==========
  function showDetail(product) {
    stopCountdown();
    $('#detail-name').textContent = product.name || '(未命名)';
    $('#detail-price').textContent = Number(product.price || 0).toFixed(2);
    $('#detail-barcode').textContent = product.barcode || '--';
    const imgWrap = $('#detail-img');
    imgWrap.innerHTML = '';
    if (product.image) {
      const img = document.createElement('img');
      img.src = product.image;
      img.alt = product.name || '';
      imgWrap.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.className = 'detail-img-empty';
      span.textContent = '暂无图片';
      imgWrap.appendChild(span);
    }
    showView('detail');
    startCountdown(4);
  }

  // ========== 处理扫码结果 ==========
  function handleScanResult(barcode) {
    const p = Storage.getByBarcode(barcode);
    if (p) {
      showDetail(p);
    } else {
      // 未找到,询问是否去添加
      stopScanCamera();
      if (confirm('未找到条码为「' + barcode + '」的商品,是否现在添加?')) {
        openForm(null, { barcode });
      } else {
        // 继续扫码
        startMainScan();
      }
    }
  }

  // ========== 首页进入扫码 ==========
  function startMainScan() {
    if (!Scanner.isSupported()) {
      // 不支持,直接走手动输入
      toast('当前浏览器不支持摄像头扫码', 2200);
      promptManualBarcode();
      return;
    }
    showView('scan');
    const video = $('#scan-video');
    mainScanner = new Scanner(video, {
      onDetect: (v) => { mainScanner.stop(); handleScanResult(v); },
      onError: (msg) => { toast(msg, 2500); },
    });
    mainScanner.start();
  }

  function promptManualBarcode() {
    const code = prompt('请输入商品条形码');
    if (code && code.trim()) handleScanResult(code.trim());
  }

  // ========== 表单页扫码(弹层) ==========
  function openFormModalScan() {
    const modal = $('#modal-scan');
    modal.hidden = false;
    const video = $('#modal-video');
    modalScanner = new Scanner(video, {
      onDetect: (v) => {
        modalScanner.stop();
        $('#modal-scan').hidden = true;
        $('#f-barcode').value = v;
        toast('已识别条码: ' + v);
      },
      onError: (msg) => { toast(msg, 2500); },
    });
    modalScanner.start();
  }

  // ========== 添加 / 编辑商品 ==========
  let editingId = null;
  function openForm(id = null, prefill = {}) {
    editingId = id;
    const f = $('#product-form');
    f.reset();
    $('#f-image-preview').hidden = true;
    $('#f-image-preview').src = '';
    $('#f-image-placeholder').hidden = false;
    $('#form-title').textContent = id ? '编辑商品' : '添加商品';

    if (id) {
      const p = Storage.getById(id);
      if (p) {
        $('#f-id').value = p.id;
        $('#f-barcode').value = p.barcode || '';
        $('#f-name').value = p.name || '';
        $('#f-price').value = p.price || '';
        $('#f-spec').value = p.spec || '';
        if (p.image) {
          $('#f-image-preview').src = p.image;
          $('#f-image-preview').hidden = false;
          $('#f-image-placeholder').hidden = true;
        }
      }
    } else {
      $('#f-id').value = '';
      if (prefill.barcode) $('#f-barcode').value = prefill.barcode;
    }
    showView('form');
  }

  // ========== 提交表单 ==========
  function submitForm(e) {
    e.preventDefault();
    const data = {
      id: $('#f-id').value || undefined,
      barcode: $('#f-barcode').value.trim(),
      name: $('#f-name').value.trim(),
      price: parseFloat($('#f-price').value) || 0,
      spec: $('#f-spec').value.trim(),
      image: $('#f-image-preview').src || '',
    };
    if (!data.barcode) { toast('请输入条形码'); return; }
    if (!data.name) { toast('请输入商品名称'); return; }
    if (data.price < 0) { toast('价格不能为负'); return; }

    const { item, conflict } = Storage.upsert(data);
    if (conflict) {
      toast('该条形码已存在: ' + item.name);
      return;
    }
    toast('保存成功');
    editingId = null;
    // 保存后回到列表
    renderManage();
    showView('manage');
  }

  // ========== 图片上传 -> base64 存储 ==========
  function bindImageUpload() {
    const input = $('#f-image');
    input.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        toast('图片过大,请选择 2MB 以内');
        input.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        // 等比压缩到最长边 800
        const img = new Image();
        img.onload = () => {
          const max = 800;
          let w = img.width, h = img.height;
          if (w > h && w > max) { h = h * max / w; w = max; }
          else if (h > max) { w = w * max / h; h = max; }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const out = canvas.toDataURL('image/jpeg', 0.82);
          $('#f-image-preview').src = out;
          $('#f-image-preview').hidden = false;
          $('#f-image-placeholder').hidden = true;
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  // ========== 事件绑定 ==========
  function bindEvents() {
    // 首页
    $('#btn-scan').addEventListener('click', startMainScan);
    $('#btn-manage').addEventListener('click', () => {
      renderManage();
      showView('manage');
    });

    // 通用返回
    $$('[data-back]').forEach(btn => {
      btn.addEventListener('click', () => showView('home'));
    });

    // 扫码页手动输入
    $('#btn-manual-input').addEventListener('click', promptManualBarcode);

    // 管理页 +
    $('#btn-add').addEventListener('click', () => openForm(null));

    // 表单
    $('#product-form').addEventListener('submit', submitForm);
    $('#f-scan-trigger').addEventListener('click', openFormModalScan);
    $('#modal-scan-close').addEventListener('click', stopModalScan);
    bindImageUpload();

    // 详情页语音
    $('#btn-voice').addEventListener('click', () => {
      const name = $('#detail-name').textContent;
      const price = $('#detail-price').textContent;
      const ok = Speech.speak('商品 ' + name + ',价格 ' + price + ' 元');
      if (ok) toast('播报中...');
      else toast('当前环境不支持语音播报');
    });
  }

  // ========== 启动 ==========
  document.addEventListener('DOMContentLoaded', () => {
    Storage.seedIfEmpty();
    bindEvents();
    showView('home');
  });
})();
