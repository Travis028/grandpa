import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
});

export const apiCache = {
  data: JSON.parse(localStorage.getItem('apiCache') || '{}'),
  get: async function(url) {
    if (this.data[url]) {
      api.get(url).then(res => {
        this.data[url] = res.data;
        localStorage.setItem('apiCache', JSON.stringify(this.data));
      }).catch(()=>{});
      return { data: this.data[url] };
    }
    const res = await api.get(url);
    this.data[url] = res.data;
    localStorage.setItem('apiCache', JSON.stringify(this.data));
    return { data: res.data };
  },
  clear: function(url) {
    if (url) delete this.data[url];
    else this.data = {};
    localStorage.setItem('apiCache', JSON.stringify(this.data));
  }
};

export default api;
