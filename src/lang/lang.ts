import base from "./base";

// English is in the first load. The other languages load when they are chosen (see store/lang.ts).
export default {
  en: {
    label: "English",
    lang: base,
  },
  it: {
    label: "Italian",
    load: () => import("./it"),
  },
  de: {
    label: "German",
    load: () => import("./de"),
  },
  nl: {
    label: "Dutch",
    load: () => import("./nl"),
  },
  zhcn: {
    label: "Simplified Chinese",
    load: () => import("./zh-cn"),
  },
  test: {
    label: "Tester",
    load: () => import("./test"),
  },
};
