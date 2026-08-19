export type PaletteColor = "primary"|"blue"|"green"|"danger"|"purple"|"yellow"|"gray";
export type ClientStatus = "Actif"|"Inactif";
export interface Client {
  id:string; name:string; initials:string; color:PaletteColor;
  email:string; phone:string; city:string;
  totalInvoices:number; totalAmount:string; lastInvoice:string; status:ClientStatus;
}