export const thingCategories = ["Everyday", "Keyboards", "Desk", "Model cars"] as const;

export type ThingCategory = (typeof thingCategories)[number];
export type DeskIllustration = "keyboard" | "desk" | "light-bar" | "plant" | "stand" | "speaker";

type Thing = {
  id: string;
  name: string;
  detail: string;
  category: ThingCategory;
} & ({ image: string; illustration?: never } | { image?: never; illustration: DeskIllustration });

// Keep the collection here so adding an object also updates the filter counts.
// Unspecified models use an illustration rather than a photograph of a different product.
export const things: readonly Thing[] = [
  { id: "iphone", name: "iPhone 17 Pro Max", detail: "Apple · Phone", category: "Everyday", image: "/things/iphone-17-pro-max.webp" },
  { id: "mac-mini", name: "Mac mini", detail: "Apple · Desktop", category: "Everyday", image: "/things/mac-mini.webp" },
  { id: "watch", name: "Apple Watch", detail: "Apple · On the wrist", category: "Everyday", image: "/things/apple-watch.webp" },
  { id: "mx-master", name: "MX Master 3S", detail: "Logitech · Mouse", category: "Desk", image: "/things/mx-master-3s.webp" },
  { id: "k1-pro", name: "Keychron K1 Pro", detail: "Keychron · Low profile", category: "Keyboards", image: "/things/keychron-k1-pro.webp" },
  { id: "k8-pro", name: "Keychron K8 Pro", detail: "Keychron · Mechanical", category: "Keyboards", image: "/things/keychron-k8-pro.webp" },
  { id: "8bitdo", name: "8BitDo Fami Edition TKL", detail: "8BitDo · Retro mechanical", category: "Keyboards", image: "/things/8bitdo-forme.webp" },
  { id: "cooler-master", name: "Cooler Master keyboard", detail: "Cooler Master · Keyboard", category: "Keyboards", illustration: "keyboard" },
  { id: "desk", name: "Height-adjustable desk", detail: "Electric · Sit or stand", category: "Desk", illustration: "desk" },
  { id: "light-bar", name: "Monitor light bar", detail: "A little light on the desk", category: "Desk", illustration: "light-bar" },
  { id: "speaker", name: "GoVee Bluetooth speaker", detail: "Budget speaker · Does the job", category: "Desk", illustration: "speaker" },
  { id: "headphone-stand", name: "Headphone stand", detail: "A place for the headphones", category: "Desk", illustration: "stand" },
  { id: "gallardo", name: "Lamborghini Gallardo", detail: "Lamborghini · Model car", category: "Model cars", image: "/things/lamborghini-gallardo.webp" },
  { id: "m3-gtr", name: "BMW M3 GTR", detail: "BMW · Model car", category: "Model cars", image: "/things/bmw-m3-gtr.webp" },
  { id: "675lt", name: "McLaren 675LT", detail: "McLaren · Model car", category: "Model cars", image: "/things/mclaren-675lt.webp" },
  { id: "plant", name: "Desk plant", detail: "A little green among the gear", category: "Desk", illustration: "plant" },
];
