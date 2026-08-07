export type PaletteColor = "primary"|"blue"|"green"|"danger"|"purple"|"yellow"|"gray";
export type QuoteStatus = "En attente"|"Accepte"|"Refuse"|"Expire";
export interface Quote {
  id:string; code:string; clientName:string; clientInitials:string;
  clientColor:PaletteColor; amount:string; status:QuoteStatus;
  issueDate:string; validUntil:string;
}