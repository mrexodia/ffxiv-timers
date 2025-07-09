import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

const app = mount(App, {
  target: document.getElementById("app"),
});

export default app;
