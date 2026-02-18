interface ICase {
  id: string;
  title: string;
  ticketnumber: string;
  createdon: string;
  modifiedon: string;
  melddatum?: string;
  code: string;
  omschrijving?: string;
  state: {
    label: string;
    code: number;
  };
  status: {
    label: string;
    code: number;
  };
  casetype: {
    label: string;
    code: number;
  };
  subject: {
    label: string;
    id: string;
  };
}

type TCaseCommentPayload = {
  subject: string;
  description: string;
};

type TCaseCommentResponse = {
  message: string;
};
