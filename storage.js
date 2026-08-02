// 简易商品数据存储 - 基于 localStorage
(function (global) {
  const KEY = 'scan_price_products_v1';

  function readAll() {
    try {
      // 某些浏览器在 file:// 协议下没有 localStorage
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.warn('读取商品数据失败', e);
      return [];
    }
  }

  function writeAll(list) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('写入商品数据失败', e);
    }
  }

  function genId() {
    return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  const Storage = {
    list() { return readAll(); },

    getByBarcode(barcode) {
      if (!barcode) return null;
      return readAll().find(p => p.barcode === String(barcode)) || null;
    },

    getById(id) {
      if (!id) return null;
      return readAll().find(p => p.id === id) || null;
    },

    // 通过 barcode 去重添加;若已存在同 barcode 则返回已有商品 + conflict=true
    upsert(product) {
      const list = readAll();
      if (product.id) {
        const idx = list.findIndex(p => p.id === product.id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...product, updatedAt: Date.now() };
          writeAll(list);
          return { item: list[idx], conflict: false };
        }
      }
      // 新增,检查 barcode
      const existed = list.find(p => p.barcode === product.barcode);
      if (existed) {
        return { item: existed, conflict: true };
      }
      const newItem = {
        id: genId(),
        name: '',
        price: 0,
        spec: '',
        image: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...product,
      };
      list.unshift(newItem);
      writeAll(list);
      return { item: newItem, conflict: false };
    },

    remove(id) {
      const list = readAll().filter(p => p.id !== id);
      writeAll(list);
    },

    // 预置两条示例数据(仅在空库时初始化,方便首体验)
    seedIfEmpty() {
      const list = readAll();
      if (list.length > 0) return;
      const samples = [
        {
          id: genId(),
          barcode: '00223145',
          name: '日',
          price: 58,
          spec: '',
          image: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: genId(),
          barcode: '6976802610980',
          name: '哇哈哈',
          price: 10,
          spec: '500ml',
          image: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      writeAll(samples);
    },
  };

  global.Storage = Storage;
})(window);
