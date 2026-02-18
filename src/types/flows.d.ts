type TAuthenticationFlow =
  | "request-login"
  | "reset-password"
  | "reset-username";

interface IFlowDefinitionResponse {
  code: string;
  definition: IFlowDefinition;
  translations: IFlowTranslations;
}

interface IFlowDefinition {
  startNode: number;
  inputParameters: IFlowInputParameter[];
  publicParameters: IFlowPublicParameter[];
  nodes: IFlowNode[];
}

interface IFlowInputParameter {
  key: string;
  value: string | boolean | number | null | string[] | boolean[];
}

interface IFlowPublicParameter {
  key: string;
  $value: string;
}

interface IFlowNode {
  id: number;
  label: string;
  actions: TFlowAction[];
}

type TFlowAction =
  | IFlowSetAction
  | IFlowTransitionAction
  | IFlowFormAction
  | IFlowAction
  | IFlowExecAsyncAction
  | IFlowExecAction
  | IFlowSaveAction
  | IFlowLoadAction
  | IFlowDisableBackAction
  | IFlowEndAction;

interface IFlowBaseAction {
  type: string;
  condition?: TFlowCondition;
  conditionString?: string;
  errorNode?: number;
}

interface IFlowSetAction extends IFlowBaseAction {
  type: "set";
  data: {
    setters: TFlowSetter[];
  };
}

type TFlowSetter = {
  key: string;
  value?: string | boolean | number;
  $value?: string;
  "@value"?: string;
};

interface IFlowTransitionAction extends IFlowBaseAction {
  type: "transition";
  data: {
    nodeId: number | string;
  };
}

interface IFlowFormAction extends IFlowBaseAction {
  type: "form";
  data: {
    elements?: TFlowFormElement[];
    $elements?: string;
  };
}

type TFlowFormElement =
  | IFlowTitleElement
  | IFlowRichTextElement
  | IFlowSelectElement
  | IFlowInputElement
  | IFlowCheckboxElement
  | IFlowFileElement
  | IFlowLinkElement;

interface IFlowBaseFormElement {
  type: string;
  data: {
    "@text"?: string;
    "@content"?: string;
    "@label"?: string;
    "@inputText"?: string;
    "@url"?: string;
    "@target"?: string;
    condition?: TFlowCondition;
    conditionString?: string;
    properties?: { key: string; value: any }[];
  };
}

interface IFlowTitleElement extends IFlowBaseFormElement {
  type: "title";
  data: {
    "@text": string;
  };
}

// interface IFlowRichTextElement extends IFlowBaseFormElement {
//   type: "rich-text";
//   data: {
//     "@content": string | TFlowRichTextContent;
//   };
// }

type TFlowRichTextDocContent = {
  type: "doc";
  content: {
    type: string;
    content?: {
      type: string;
      text?: string;
      marks?: { type: string }[];
    }[];
    attrs?: {
      content?: string;
    };
  }[];
};

type TFlowTextContent = {
  type: "text";
  text: string;
};

interface IFlowSelectElement extends IFlowBaseFormElement {
  type: "select";
  data: {
    required: boolean;
    list?: TFlowSelectOption[];
    $list?: string;
    outputKey: string;
    "@label"?: string;
    multiSelect?: boolean;
  };
  properties?: { placeholder?: string };
}

interface IFlowSelectElement extends IFlowBaseFormElement {
  type: "list";
  data: {
    required: boolean;
    items?: (IPaymentOverviewItem | Icase)[];
    columns?: TFlowColumnSelectOption[];
    $list?: string;
    outputKey: string;
    "@label"?: string;
    multiSelect?: boolean;
  };
  properties?: { placeholder?: string };
}

type TFlowSelectOption = {
  value: string;
  "@text"?: string;
  text?: string;
};

type TFlowColumnSelectOption = {
  value: string;
  label?: string;
  displayFormat?: "date" | "currency";
};

interface IFlowInputElement extends IFlowBaseFormElement {
  type: "input";
  data: {
    outputKey: string;
    required: boolean;
    "@label"?: string;
    pattern?: string;
  };
  default?: string;
  properties?: { placeholder?: string };
}

interface IFlowCheckboxElement extends IFlowBaseFormElement {
  type: "checkbox";
  data: {
    outputKey: string;
    "@label"?: string;
    required?: boolean;
  };
}

interface IFlowFileElement extends IFlowBaseFormElement {
  type: "file";
  data: {
    outputKey: string;
    multiple: boolean;
    accept: string[];
    "@inputText"?: string;
    required?: boolean;
    maxSize?: number;
    multipleFiles?: boolean;
  };
  properties?: { placeholder?: string };
}

interface IFlowElementBase {
  type:
    | "select"
    | "input"
    | "checkbox"
    | "file"
    | "date-input"
    | "title"
    | "rich-text"
    | "list"
    | "link";
  properties?: Record<string, any>;
}

interface IFlowAction extends IFlowBaseAction {
  type: "flow";
  data: {
    outputKey?: string;
    name: string;
    stateObj?: TFlowStateObject[];
    async?: boolean;
  };
}

type TFlowStateObject = {
  key: string;
  value?: string | boolean | number;
  $value?: string;
};

interface IFlowExecAsyncAction extends IFlowBaseAction {
  type: "execAsync";
  data: string[];
}

interface IFlowExecAction extends IFlowBaseAction {
  type: "exec";
  data: string[];
}

interface IFlowSaveAction extends IFlowBaseAction {
  type: "save";
  data: {
    httpMethod: "post" | "put" | "patch" | "delete";
    $content: string;
    outputKey: string;
    query: string;
    source: "API" | "CRM";
  };
}

interface IFlowLoadAction extends IFlowBaseAction {
  type: "load";
  data: {
    outputKey: string;
    source: "API" | "CRM";
    $query: string;
  };
}

interface IFlowDisableBackAction extends IFlowBaseAction {
  type: "disableBack";
}

interface IFlowEndAction extends IFlowBaseAction {
  type: "end";
}

type TFlowCondition = {
  $value1?: string;
  type?: "notExists" | "notMatch";
  value2?: string;
};

interface IFlowTranslations {
  [language: string]: {
    [key: string]:
      | string
      | TFlowRichTextContent
      | {
          type: string;
          content?: any;
          attrs?: {
            content?: string;
          };
        };
  };
}

interface IFlowInitializationResponse {
  id: string;
  status: IFlowStatus;
  state: TFlowState;
  elements: TFlowElement[];
  snapshotKey: string;
  properties: Record<string, any>;
  currentNode: IFlowCurrentNode;
}

interface IFlowStatus {
  running: boolean;
  backEnabled: boolean;
}

type TFlowState = Record<string, any>;

type TFlowElement =
  | IFlowTitleElementInstance
  | IFlowRichTextElement
  | IFlowInputElement
  | IFlowSelectElement
  | IFlowCheckboxElement
  | IFlowFileElement
  | IFlowDateInputElement
  | IFlowListElement
  | IFlowLinkElement
  | IFlowDisplayElement; // Add this line

interface IFlowTitleElementInstance {
  type: "title";
  data: {
    text: string;
    content: TFlowRichTextContent;
    contentHTML: string;
  };
  properties: Record<string, any>;
}

// Root doc node
// Example: { type: "doc", content: [ ...blocks ] }
type TFlowRichTextContent = {
  type: "doc";
  content: TFlowRichTextBlock[];
};

type TFlowRichTextBlock = {
  type:
    | "paragraph"
    | "heading"
    | "bulletList"
    | "orderedList"
    | "listItem"
    | string;
  content?: TFlowRichTextInline[];
  attrs?: {
    level?: number;
    [key: string]: any;
  };
};

type TFlowRichTextInline = {
  type: "text" | "hardBreak" | string;
  text?: string;
  marks?: {
    type: "bold" | "italic" | "underline" | "link" | string;
    attrs?: Record<string, any>;
  }[];
};

interface IFlowRichTextElement {
  type: "rich-text";
  data: {
    content: TFlowRichTextContent;
    contentHTML: string;
  };
  properties: Record<string, any>;
}

interface IFlowDisplayElement {
  type: "display";
  data: {
    text: string;
  };
  properties: Record<string, any>;
}

interface IFlowCurrentNode {
  flow: string;
  node: string;
  nodeId: number;
  actionIndex: number;
}

type TFlowProcess = {
  id: string;
  code: string;
  label: string;
  websiteLabel: string;
  description: string;
  type: string;
  flowCode: string;
  groups: TFlowGroups[];
  color?: string;
  requireContract: boolean;
  requireAuthentication: boolean;
  iconURL: string;
  defaultIcon?: string;
  defaultLabel?: string;
  defaultDescription?: string;
  processCategoryId: string;
  settings: {
    id: string;
    processId: string;
    tenantId: string;
    rules: Record<string, unknown>;
    roles: string[];
    translations: {
      [lang: string]: {
        Flow_Titel_Website: string;
      };
    };
    tasks: Record<string, unknown>;
    caseInstructions: Record<string, unknown>;
    enabledCRM: boolean;
    requireAuthentication: boolean;
    enabledWebsite: boolean;
    reportToCRM: boolean;
    createdAt: string;
    updatedAt: string;
  };
  processCategory: {
    id: string;
    code: string;
    label: string;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  flowName?: string;
};

interface IFlowDateInputElement extends IFlowBaseFormElement {
  type: "date-input";
  data: {
    outputKey: string;
    required?: boolean;
    minValue?: string;
    maxValue?: string;
    includeTime?: boolean;
    "@label"?: string;
  };
  properties?: { placeholder?: string };
}
interface IFlowListItem {
  id: string;
  [key: string]: string | number | any;
}

interface IFlowListColumn {
  value: string;
  label: string;
  displayFormat?: "currency" | "date" | "datetime";
}
interface IFlowSelectListProps {
  items: IFlowListItem[];
  columns: IFlowListColumn[];
  selected: any;
  onSelectionChange: (selected: any) => void;
  error?: string;
  required?: boolean;
  multiSelect?: boolean;
  selectionMessage?: string;
  disabled?: boolean;
}

interface IPaymentOverviewItem {
  id: string;
  code: string;
  saldo: number;
  omschrijving: string;
  factuurdatum: string;
  vervaldatum: string;
  detailsoort: {
    code: string;
    naam: string;
  };
  boekdatum: string;
  bedrag: number;
  betalingsregeling: boolean;
  externeIncasso: boolean;
  beginfactuur: boolean;
  afletteringenBeschikbaar: boolean;
  [key: string]: any;
}

interface TFlowLinkElement {
  type: "link";
  data: {
    url?: string;
    text?: string;
  };
}
interface TFlowPaymentData {
  RedirectURL: string;
  SelectieItemsDetails?: any[];
  SelectieItems?: any[];
  Kenmerken?: string[];
  Bedrag?: number;
  [key: string]: any;
}
interface IFlowListElementProps {
  element: {
    type: string;
    data: {
      items: any[];
      columns: Array<{
        value: string;
        label: string;
        displayFormat?: string;
      }>;
      outputKey: string;
      required?: boolean;
      multiSelect?: boolean;
    };
  };
  value: string[];
  onChange: (key: string, value: any) => void;
  error?: string;
  label?: string;
}
interface IFlowListElement extends IFlowBaseFormElement {
  type: "list";
  data: {
    items: IPaymentOverviewItem[];
    outputKey: string;
    required: boolean;
    multiSelect?: boolean;
    flowType?: "payment" | "repair";
    columns: Array<{
      value: string;
      label: string;
      displayFormat?: string;
    }>;
  };
  properties: Record<string, any>;
}
type TFlowGroups =
  | "home"
  | "flow"
  | "verhuren"
  | "huurcontract"
  | "reparatieverzoek"
  | "leefbaarheid"
  | "finance"          
  | "diensten"
  | "contract"
  | "contact"
  | "account"; 

interface IFlowElementData {
  status?: string;
  paymentStatus?: string;
  "@url"?: string;
  text?: string;
  outputKey?: string;
  required?: boolean;
  "@label"?: string;
  pattern?: string;
}

interface IFlowLinkData extends IFlowElementData {
  "@url": string;
  status?: "PAID" | "PENDING" | "FAILED";
  paymentStatus?: "PAID" | "PENDING" | "FAILED";
}

interface IFlowElement {
  type: string;
  data: IFlowElementData;
}

interface IFlowLinkElement extends IFlowElement {
  type: "link";
  data: IFlowLinkData;
}

// Unfinished Flow Storage Types
interface IUnfinishedFlow {
  id: string; // Flow instance ID
  flowCode: string; // Flow definition code
  flowLabel: string; // Flow display label
  flowName: string; // Flow display name
  currentInstance: IFlowInitializationResponse;
  currentDefinition?: IFlowDefinitionResponse;
  currentSnapshots: IFlowInitializationResponse[];
  currentStep: number;
  formData: Record<string, any>;
  snapshotFormData: Record<string, Record<string, any>>;
  lastUpdated: string; // ISO timestamp
  createdAt: string; // ISO timestamp
}

type TUnfinishedFlows = IUnfinishedFlow[];

interface IUseFlowReturn {
  handleContinue: (formData: Record<string, unknown>) => void;
  handleBack: () => void;
  handleRestore: (snapshotKey: string) => void;
  refetch: () => Promise<unknown>;
  currentDefinition: IFlowDefinitionResponse | undefined;
  currentInstance: IFlowInitializationResponse | undefined;
  isLoading: boolean;
  isContinueLoading: boolean;
  isBackLoading: boolean;
  isRestoreFlowLoading: boolean;
  definitionError: TApiError | null;
  initiateFlowError: TApiError | null;
  continueError: TApiError | null;
  backError: TApiError | null;
  existingLabel: string | undefined;
  flowName: string | undefined;
  currentStep: number;
  currentSnapshots: IFlowInitializationResponse[];
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  renderFields: boolean;
  handleElementChange: (outputKey: string, value: any) => void;
  selectField: IFlowSelectElement;
  hasOneSelectField: boolean;
  continueDisabled: boolean;
  handleContinueWithValidation: () => Promise<void>;
  isRedirecting: boolean;
  showLabel: boolean;
  openRedirectLink: () => void;
  error?: Error;
  continueFlowError?: Error;
}

interface IUseAuthenticationFlowReturn {
  handleContinue: (formData: Record<string, unknown>) => void;
  handleBack: () => void;
  handleRestore: (snapshotKey: string) => void;
  refetch: () => Promise<unknown>;
  currentInstance: IFlowInitializationResponse | undefined;
  isLoading: boolean;
  isContinueLoading: boolean;
  isBackLoading: boolean;
  isRestoreFlowLoading: boolean;
  initiateFlowError: TApiError | null;
  continueError: TApiError | null;
  backError: TApiError | null;
  currentStep: number;
  currentSnapshots: IFlowInitializationResponse[];
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  renderFields: boolean;
  handleElementChange: (outputKey: string, value: any) => void;
  selectField: IFlowSelectElement;
  hasOneSelectField: boolean;
  continueDisabled: boolean;
  handleContinueWithValidation: () => Promise<void>;
  showLabel: boolean;
  error?: Error;
  continueFlowError?: Error;
  selectedTenant: {
    id: string;
    name?: string | undefined;
  } | null;
  updateSelectedTenant: React.Dispatch<
    React.SetStateAction<{
      id: string;
      name?: string | undefined;
    } | null>
  >;
  flow:
    | {
        label: string;
        value: "request-login";
        flowCode: string;
        code: string;
      }
    | {
        label: string;
        value: "reset-password";
        flowCode: string;
        code: string;
      }
    | {
        label: string;
        value: "reset-username";
        flowCode: string;
        code: string;
      }
    | undefined;
}
