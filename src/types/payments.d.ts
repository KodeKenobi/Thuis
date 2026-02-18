interface IPaymentData {
  totaalSaldo: number;
  totalOutstandingBalance: number;
  totalOutstandingInvoices: number;
  totalInvoices: number;
  items: IPaymentItem[];
}

interface IPaymentItem {
  id: string;
  omschrijving: string;
  boekdatum: string;
  saldo: number;
  detailsoort: IDetailSoort;
}

interface IDetailSoort {
  code: string;
  naam: string;
}

interface IPaymentOverviewItem {
  id: string;
  code: string;
  detailsoort: {
    code: string;
    naam: string;
  };
  omschrijving: string;
  boekdatum: string;
  factuurdatum: string;
  vervaldatum: string;
  bedrag: number;
  saldo: number;
  betalingsregeling: boolean;
  externeIncasso: boolean;
  beginfactuur: boolean;
  huurovereenkomst?: {
    code: string;
  };
  afletteringenBeschikbaar: boolean;
}

interface IGroupedPaymentData {
  rentalUnitCode: string;
  items: IPaymentOverviewItem[];
  totalSaldo: number;
  totalBedrag: number;
}
