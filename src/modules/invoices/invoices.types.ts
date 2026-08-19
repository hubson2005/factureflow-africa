export type PaletteColor = "primary"|"blue"|"green"|"danger"|"purple"|"yellow"|"gray";
export type InvoiceStatus = "Payée"|"Impayée"|"Envoyée";
export interface Invoice {
  id: string; code: string; clientName: string; clientInitials: string;
  clientColor: PaletteColor; amount: string; status: InvoiceStatus;
  issueDate: string; dueDate?: string;
  clientEmail?: string; clientPhone?: string; clientAddress?: string;
}