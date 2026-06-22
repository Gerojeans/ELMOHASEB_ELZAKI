@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: var(--app-font, "Cairo"), ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

:root {
  --app-bg: #E4E3E0;
  --app-text: #141414;
  --app-heading: #141414;
  --app-detail: #141414;
  --app-card-bg: #FFFFFF;
  --app-font: "Cairo";
}

body {
  direction: rtl;
  background-color: var(--app-bg);
  color: var(--app-text);
  font-family: var(--app-font), sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}

h1, h2, h3, h4, h5, h6 {
  color: var(--app-heading);
}

.text-detail {
  color: var(--app-detail);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(20, 20, 20, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(20, 20, 20, 0.3);
}

.custom-scrollbar-dark::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar-dark::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar-dark::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.sidebar-item-active {
  background: #141414;
  color: #E4E3E0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

