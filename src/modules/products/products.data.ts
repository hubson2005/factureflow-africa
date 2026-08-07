export type PaletteColor = "primary"|"blue"|"green"|"danger"|"purple"|"yellow"|"gray";
export type ProductCategory = "Service"|"Produit"|"Abonnement";
export interface Product {
  id:string; name:string; category:ProductCategory; price:string; unit:string;
  stock?:number; color:PaletteColor; initials:string; description:string;
}
export const demoProducts: Product[] = [
  { id:"1", name:"Conseil juridique", category:"Service", price:"75 000", unit:"heure", color:"primary", initials:"CJ", description:"Conseil et accompagnement juridique" },
  { id:"2", name:"Maintenance informatique", category:"Service", price:"50 000", unit:"intervention", color:"blue", initials:"MI", description:"Support et maintenance systemes" },
  { id:"3", name:"Ordinateur portable", category:"Produit", price:"450 000", unit:"unite", stock:12, color:"purple", initials:"OP", description:"Laptop professionnel 15 pouces" },
  { id:"4", name:"Abonnement ERP", category:"Abonnement", price:"120 000", unit:"mois", color:"green", initials:"AE", description:"Acces plateforme ERP complet" },
  { id:"5", name:"Formation React", category:"Service", price:"200 000", unit:"session", color:"yellow", initials:"FR", description:"Formation developpement web React" },
  { id:"6", name:"Imprimante laser", category:"Produit", price:"185 000", unit:"unite", stock:4, color:"danger", initials:"IL", description:"Imprimante laser couleur A4" },
  { id:"7", name:"Logiciel comptabilite", category:"Abonnement", price:"35 000", unit:"mois", color:"blue", initials:"LC", description:"Logiciel de comptabilite cloud" },
];