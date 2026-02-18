interface IRentPeriod {
  periods: string[];
  rentData: IRentData[];
}

interface IRentData {
  soort: IRentType;
  detailsoort: IRentDetailType;
  prijselement: IPriceElement;
  begindatum: string;
  bedrag: number;
  btw: IBtwType;
  wijzigingsreden?: IChangeReason;
  id: string;
  code: string;
}

interface IRentType {
  id: string;
  code: string;
  naam: string;
}

interface IRentDetailType {
  id: string;
  code: string;
  naam: string;
}

interface IPriceElement {
  naam: string;
  serviceabonnement: boolean;
  soort: IRentType;
  detailsoort: IRentDetailType;
  id: string;
  code: string;
}

interface IBtwType {
  code: string;
}

interface IChangeReason {
  id: string;
  code: string;
  naam: string;
}
