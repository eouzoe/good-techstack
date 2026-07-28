/// Raw string imports for drizzle migrations (Vite `?raw`).
declare module '*.sql?raw' {
  const content: string;
  export default content;
}
