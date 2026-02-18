interface IMaintenanceStatus {
  id?: string;
  code?: string;
  naam: string;
}

interface IMaintenanceEenheid {
  id: string;
}

interface IMaintenanceRelatie {
  id: string;
  code: string;
  naam: string;
}

interface IMaintenanceTask {
  id: string;
  code: string;
  externalTaakId?: string;
  omschrijving?: string;
  status: IMaintenanceStatus;
}

interface IMaintenanceOrder {
  id: string;
  code: string;
  omschrijving?: string;
  werkomschrijving?: string;
  inkooporder?: string;
  begindatum?: string;    
  uitersteGereeddatum?: string; 
  status: IMaintenanceStatus;
  relaties?: IMaintenanceRelatie[];
  onderhoudstaken?: IMaintenanceTask[];
}

interface IMaintenance {
  contract: IContract;
  omschrijving?: string;
  status: IMaintenanceStatus;
  eenheid: IMaintenanceEenheid;
  id: string;
  code: string;
  melddatum: string;
  begindatum?: string;
  collectiefObject?: {
    id: string;
    naam: string;
  };
}

interface IMaintenanceDetail extends IMaintenance {
  toelichting?: string[];              // array of texts
  onderhoudsorders?: IMaintenanceOrder[];
}
