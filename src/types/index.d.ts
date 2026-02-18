type TApiError = AxiosError<{
  message:
    | string
    | {
        response: {
          data: {
            detail?: string;
            message?: string;
          };
          status: number;
        };
      };
}>;

type TFetchOptions = {
  method: string;
  headers?: Record<string, string>;
  body?: any;
  cacheTTL?: number;
  params?: Record<string, string>;
};
