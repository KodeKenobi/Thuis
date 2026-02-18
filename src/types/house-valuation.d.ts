interface IHouseValuation {
  periods: string[];
  data: IHouseValuationData[];
}

interface IHouseValuationData {
  begindatum: string;
  einddatum: string;
  groepen: ICriteriumGroep[];
  maximaleHuur: number;
  punten: number;
  id: string;
}

interface ICriteriumGroep {
  punten: number;
  criteriumGroep: {
    naam: string;
    soort: ICriteriumSoort;
    stelsel: ICriteriumStelsel;
    id: string;
    code: string;
  };
  woningwaarderingen: IWoningwaardering[];
  id: string;
  code: string;
}

interface ICriteriumSoort {
  id: string;
  code: string;
  naam: string;
}

interface ICriteriumStelsel {
  id: string;
  code: string;
  naam: string;
}

interface IWoningwaardering {
  criterium: {
    naam: string;
    meeteenheid?: IMeeteenheid;
    id: string;
    code: string;
  };
  aantal: number;
  punten: number;
  id: string;
}

interface IMeeteenheid {
  id: string;
  naam: string;
}
