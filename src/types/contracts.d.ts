interface IContract {
  begindatum: string;
  einddatum?: string;
  soort: ISoort;
  detailSoort: IDetailSoort;
  eenheden: IEenheden[];
  relaties: IRelaty[];
  id: string;
  code: string;
  minimaleEinddatum?: string;
  brutoHuur?: number;
  betaalwijze?: IBetaalwijze;
  opzegtermijn?: IOpzegtermijn;
  omklapcontract?: boolean;
  bepaaldeTijd?: boolean;
  vastgoedeenheid?: IVastgoedeenheid;
  btw?: boolean;
}

interface IContractDetail extends IContract {}

interface IAdres {
  straatnaam: string;
  huisnummer: string;
  postcode: string;
  woonplaats: string;
  id: string;
}

interface ISoort {
  id: string;
  code: string;
  naam: string;
}

interface IDetailSoort {
  id: string;
  code: string;
  naam: string;
}

interface IEenheden {
  adres: IAdres;
  vastgoedeenheid: IVastgoedeenheid;
  soort: ISoort2;
  detailsoort: IDetailSoort;
  id: string;
  code: string;
  brutoHuur?: number;
  bestemming?: IBestemming;
  inspectieAantal?: number;
  verhuurkanaal?: string;
  clusters?: any[];
}

interface IBestemming {
  id: string;
  code: string;
  naam: string;
}

interface IVastgoedeenheid {
  id: string;
}

interface ISoort2 {
  id: string;
  code: string;
  naam: string;
}

interface IRelaty {
  soort: ISoort3;
  naam: string;
  rollen: IRollen[];
  id: string;
  code: string;
}

interface ISoort3 {
  code: string;
  naam: string;
}

interface IRollen {
  soort: ISoort4;
}

interface ISoort4 {
  code: string;
  naam: string;
}

interface IOpzegtermijn {
  code: string;
}

interface IBetaalwijze {
  soort: {
    code: string;
    naam: string;
  };
  betaalgegeven: IBetaalgegeven;
  incassomachtiging: IIncassomachtiging;
  id: string;
}

interface IBetaalgegeven {
  soort: {
    code: string;
    naam: string;
  };
  begindatum: string;
  iban: string;
  rekeninghouder: string;
  id: string;
}

interface IIncassomachtiging {
  afgiftedatum: string;
  machtigingsnummer: string;
  id: string;
}

interface IContractRentData {
  contractId: string;
  straatnaam: string;
  huisnummer: string;
  rentData: IRentPeriod | null;
}

type TContractsSubset = "ALL" | "ACTIEF" | "ACTIEFINDETOEKOMST";
