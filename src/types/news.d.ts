interface IApiListResponse<T> {
  status: "success" | "error";
  message: string;
  data: T[];
}
interface IApiItemResponse<T> {
  status: "success" | "error";
  message: string;
  data: T;
}

interface IDocContent {
  type: "doc";
  content: IContentNode[];
}
interface IContentNode {
  type: string;
  attrs?: { [key: string]: any };
  content?: IContentNode[];
  marks?: IMark[];
  text?: string;
}
interface IMark {
  type: string;
  attrs?: { [key: string]: any };
}

interface IRichTextBlock {
  $component: "richText";
  content: IDocContent;
  $id: string;
}

interface INewsImage {
  id: string;
  type: "file";
  label: string;
  fileName: string;
  title: string;
  alt: string;
  focus: string;
  tags: string[];
  indexable: boolean;
  isIcon: boolean;
  height: number;
  width: number;
  url: string;
  updatedAt: string;
}
interface INewsCategory {
  key: string;
  value: string;
  fullPath: string;
  slug?: string;
}

interface INewsItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  apps: string[];
  publishedAt: string;
  publishStart: string | null;
  publishEnd: string | null;
  slug: string;
  title: string;
  image: INewsImage[] | null;
  category?: INewsCategory;
  excerpt?: string;
  content: any[];
  important: boolean;
  seo?: {
    $component: "seo";
    title: string | null;
    description: string | null;
    tags: string[] | null;
    isNotIndexable?: boolean;
  };
}

type ILocalNewsResponse = IApiListResponse<INewsItem>;
type INewsDetailResponse = IApiItemResponse<INewsItem>;
