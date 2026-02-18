# ThuisApp

This app is designed to streamline tenant interactions with their housing corporation. It provides features such as contract management, repair requests, financial transactions, and communication with the corporation. The app supports multi-corporation setups, allowing tenants from different corporations to access their specific services.

## What Does the App Do

The app provides the following features:

- **Contract Management**: Tenants can view, update, or terminate their rental contracts.
- **Repair Requests**: Submit repair requests with photos and track their status.
- **Financial Transactions**: View invoices, make payments, and set up payment plans.
- **News and Updates**: Stay informed with the latest news from the corporation.
- **Communication**: Chat with customer service or submit inquiries.
- **Multi-Corporation Support**: Tenants can log in to their specific corporation and access tailored services.

## Multi-Corporation Setup

The app is designed to support multiple housing corporations. Each corporation has its own branding, configurations, and API endpoints. Upon login, the app dynamically fetches tenant-specific configurations, such as:

- Corporation logo and name.
- API endpoints for services.
- Tenant-specific flows and permissions.

This ensures scalability and flexibility for corporations of varying sizes.

## Prerequisites

- Node.js (>=14.x)
- npm (>=6.x)

## Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

## Project Structure

```text
├── 📁 .expo/ 🚫 (auto-hidden)
├── 📁 .git/ 🚫 (auto-hidden)
├── 📁 android/ 🚫 (auto-hidden)
├── 📁 app/
│   ├── 📁 (auth)/
│   │   ├── 📄 _layout.tsx
│   │   ├── 📄 account-request-screen.tsx
│   │   ├── 📄 forgot-password-screen.tsx
│   │   ├── 📄 index.tsx
│   │   ├── 📄 otp-verification-screen.tsx
│   │   └── 📄 signin-screen.tsx
│   ├── 📁 (tabs)/
│   │   ├── 📄 _layout.tsx
│   │   ├── 📄 cases-screen.tsx
│   │   ├── 📄 flows-screen.tsx
│   │   ├── 📄 index.tsx
│   │   └── 📄 posts-screen.tsx
│   ├── 📁 chat/
│   │   ├── 📄 _layout.tsx
│   │   └── 📄 chat-screen.tsx
│   ├── 📁 contracts/
│   │   ├── 📄 [id].tsx
│   │   ├── 📄 _layout.tsx
│   │   └── 📄 contracts-screen.tsx
│   ├── 📁 financial/
│   │   ├── 📄 [id].tsx
│   │   ├── 📄 _layout.tsx
│   │   ├── 📄 financial-screen.tsx
│   │   └── 📄 invoices-screen.tsx
│   ├── 📁 flows/
│   │   ├── 📄 [id].tsx
│   │   └── 📄 _layout.tsx
│   ├── 📁 house-valuation/
│   │   ├── 📄 [unitId].tsx
│   │   └── 📄 _layout.tsx
│   ├── 📁 news/
│   │   ├── 📄 [id].tsx
│   │   ├── 📄 _layout.tsx
│   │   └── 📄 news-screen.tsx
│   ├── 📁 post/
│   │   ├── 📄 [id].tsx
│   │   └── 📄 _layout.tsx
│   ├── 📁 rent-score/
│   │   ├── 📄 [contractId].tsx
│   │   └── 📄 _layout.tsx
│   ├── 📁 settings/
│   │   ├── 📄 _layout.tsx
│   │   └── 📄 settings-screen.tsx
│   ├── 📄 +html.tsx
│   ├── 📄 +not-found.tsx
│   ├── 📄 _layout.tsx
│   ├── 📄 account-screen.tsx
│   ├── 📄 contact-screen.tsx
│   ├── 📄 repairs-screen.tsx
│   └── 📄 unfinished-flows.tsx
├── 📁 credentials/
│   └── 📁 ios/ 🚫 (auto-hidden)
├── 📁 node_modules/ 🚫 (auto-hidden)
├── 📁 scripts/
│   └── 📄 reset-project.js
├── 📁 src/
│   ├── 📁 assets/
│   │   ├── 📁 app-icons/
│   │   │   ├── 🖼️ icon.png
│   │   │   └── 🖼️ splash-icon.png
│   │   └── 📁 images/
│   │       ├── 🖼️ financial-onboarding.png
│   │       └── 🖼️ repair-onboarding.png
│   ├── 📁 components/
│   │   ├── 📁 __tests__/
│   │   │   ├── 📁 __snapshots__/
│   │   │   │   └── 📄 ThemedText-test.tsx.snap
│   │   │   └── 📄 ThemedText-test.tsx
│   │   ├── 📁 containers/
│   │   │   ├── 📁 authentication-flow/
│   │   │   │   └── 📄 authentication-flow-container.tsx
│   │   │   ├── 📁 cases/
│   │   │   │   ├── 📄 case-comment-container.tsx
│   │   │   │   └── 📄 case-list-container.tsx
│   │   │   ├── 📁 chat/
│   │   │   │   ├── 📄 chat-details.tsx
│   │   │   │   ├── 📄 chat-fullscreen-container.tsx
│   │   │   │   └── 📄 chat.tsx
│   │   │   ├── 📁 contract/
│   │   │   │   ├── 📄 maintanace.tsx
│   │   │   │   └── 📄 maintanances-container.tsx
│   │   │   ├── 📁 contracts/
│   │   │   │   └── 📄 contracts-list-container.tsx
│   │   │   ├── 📁 financial/
│   │   │   │   └── 📄 invoices-list-container.tsx
│   │   │   ├── 📁 flow/
│   │   │   │   ├── 📄 all-steps-container.tsx
│   │   │   │   ├── 📄 content-container.tsx
│   │   │   │   ├── 📄 flow-list-element-container.tsx
│   │   │   │   ├── 📄 restore-container.tsx
│   │   │   │   ├── 📄 rich-text-container.tsx
│   │   │   │   ├── 📄 select-list.tsx
│   │   │   │   └── 📄 title-container.tsx
│   │   │   ├── 📁 flows/
│   │   │   │   └── 📄 flows-list-container.tsx
│   │   │   ├── 📁 home/
│   │   │   │   ├── 📄 home-actions-container.tsx
│   │   │   │   ├── 📄 home-flows-list-container.tsx
│   │   │   │   ├── 📄 home-news-list-container.tsx
│   │   │   │   └── 📄 home-welcome-header-container.tsx
│   │   │   ├── 📁 house-valuation/
│   │   │   │   └── 📄 house-valuation-container.tsx
│   │   │   ├── 📁 news/
│   │   │   │   ├── 📄 news-detail-container.tsx
│   │   │   │   └── 📄 news-list-container.tsx
│   │   │   ├── 📁 onboarding/
│   │   │   │   └── 📄 onboarding-slide-container.tsx
│   │   │   ├── 📁 posts/
│   │   │   │   ├── 📄 post-detail-container.tsx
│   │   │   │   └── 📄 post-list-container.tsx
│   │   │   ├── 📁 rents/
│   │   │   │   └── 📄 rents-period-container.tsx
│   │   │   └── 📁 unfinished-flows/
│   │   │       └── 📄 unfinished-flow-list-container.tsx
│   │   ├── 📁 layouts/
│   │   │   ├── 📄 auth-layout.tsx
│   │   │   └── 📄 tenant-aware-layout.tsx
│   │   ├── 📁 templates/
│   │   │   ├── 📄 animated-card-template.tsx
│   │   │   ├── 📄 avatar-card-template-skeleton.tsx
│   │   │   ├── 📄 avatar-card-template.tsx
│   │   │   ├── 📄 chat-screen-template-skeleton.tsx
│   │   │   ├── 📄 header-template.tsx
│   │   │   ├── 📄 inner-screen-template.tsx
│   │   │   ├── 📄 record-card-template-skeleton.tsx
│   │   │   ├── 📄 section-template.tsx
│   │   │   ├── 📄 tab-screen-template.tsx
│   │   │   └── 📄 tab-template.tsx
│   │   └── 📁 ui/
│   │       ├── 📄 action-button.tsx
│   │       ├── 📄 amount-detail.tsx
│   │       ├── 📄 animated-reveal.tsx
│   │       ├── 📄 animated-search.tsx
│   │       ├── 📄 avatar.tsx
│   │       ├── 📄 badge.tsx
│   │       ├── 📄 bottom-sheet.tsx
│   │       ├── 📄 button-toggle.tsx
│   │       ├── 📄 button.tsx
│   │       ├── 📄 card.tsx
│   │       ├── 📄 chat-bubble.tsx
│   │       ├── 📄 checkbox.tsx
│   │       ├── 📄 confirmation-modal.tsx
│   │       ├── 📄 container.tsx
│   │       ├── 📄 date-picker.tsx
│   │       ├── 📄 detail-content.tsx
│   │       ├── 📄 divider.tsx
│   │       ├── 📄 dots-navigator.tsx
│   │       ├── 📄 drawer-navigation.tsx
│   │       ├── 📄 drawer.tsx
│   │       ├── 📄 dropdown.tsx
│   │       ├── 📄 empty-data.tsx
│   │       ├── 📄 file-uploader.tsx
│   │       ├── 📄 header.tsx
│   │       ├── 📄 icon-button.tsx
│   │       ├── 📄 input.tsx
│   │       ├── 📄 knuswonen-logo.tsx
│   │       ├── 📄 label.tsx
│   │       ├── 📄 otp-input.tsx
│   │       ├── 📄 radio.tsx
│   │       ├── 📄 record-card.tsx
│   │       ├── 📄 screen-loader.tsx
│   │       ├── 📄 select.tsx
│   │       ├── 📄 skeleton.tsx
│   │       ├── 📄 themed-text.tsx
│   │       ├── 📄 themed-view.tsx
│   │       └── 📄 toaster.tsx
│   ├── 📁 config/
│   │   ├── 📄 api.ts
│   │   ├── 📄 env.ts
│   │   ├── 📄 react-query.ts
│   │   ├── 📄 repair-cases-config.ts
│   │   ├── 📄 screen-animation.ts
│   │   └── 📄 toast.tsx
│   ├── 📁 constants/
│   │   ├── 📄 colors.ts
│   │   ├── 📄 fonts.ts
│   │   ├── 📄 global-styles.ts
│   │   └── 📄 index.ts
│   ├── 📁 contexts/
│   │   ├── 📄 auth-context.tsx
│   │   ├── 📄 theme-context.tsx
│   │   └── 📄 unfinished-flows-context.tsx
│   ├── 📁 data/
│   │   ├── 📄 flows.ts
│   │   └── 📄 menu-items.tsx
│   ├── 📁 hooks/
│   │   ├── 📄 use-authentication-flow.ts
│   │   ├── 📄 use-color-schema.ts
│   │   ├── 📄 use-color-schema.web.ts
│   │   ├── 📄 use-colors.ts
│   │   ├── 📄 use-flow.ts
│   │   ├── 📄 use-pdf-share.ts
│   │   ├── 📄 use-route-params-object.ts
│   │   ├── 📄 use-theme-color.ts
│   │   └── 📄 use-unfinished-flows.ts
│   ├── 📁 service/
│   │   ├── 📄 auth.ts
│   │   ├── 📄 authentication-flows.ts
│   │   ├── 📄 cases.ts
│   │   ├── 📄 chat.ts
│   │   ├── 📄 contracts.ts
│   │   ├── 📄 financial.ts
│   │   ├── 📄 flows.ts
│   │   ├── 📄 maintanance.ts
│   │   ├── 📄 message.ts
│   │   ├── 📄 news.ts
│   │   ├── 📄 rent.ts
│   │   ├── 📄 tenants.ts
│   │   └── 📄 valuation.ts
│   ├── 📁 types/
│   │   ├── 📄 auth.d.ts
│   │   ├── 📄 case.d.ts
│   │   ├── 📄 chat.d.ts
│   │   ├── 📄 contracts.d.ts
│   │   ├── 📄 declarations.d.ts
│   │   ├── 📄 flows.d.ts
│   │   ├── 📄 house-valuation.d.ts
│   │   ├── 📄 index.d.ts
│   │   ├── 📄 maintanance.d.ts
│   │   ├── 📄 message.d.ts
│   │   ├── 📄 news.d.ts
│   │   ├── 📄 payments.d.ts
│   │   ├── 📄 rent.d.ts
│   │   ├── 📄 tenants.d.ts
│   │   └── 📄 theme.d.ts
│   └── 📁 utils/
│       └── 📄 index.ts
├── 🔒 .env 🚫 (auto-hidden)
├── 🚫 .gitignore
├── 📖 README.md
├── 📄 app.json
├── ⚙️ azure-pipelines.yml
├── 📄 babel.config.js
├── 📄 credentials.json
├── 📄 eas.json
├── 📄 expo-env.d.ts 🚫 (auto-hidden)
├── 📄 package-lock.json
├── 📄 package.json
└── 📄 tsconfig.json
```

## Best Practices for Coding

## Naming Conventions

- **Files & Folders**: `kebab-case` (lowercase with hyphens).
- **React Components**: `PascalCase` (e.g., `UserProfile`).
- **Hooks**: `camelCase` with `use` prefix (e.g., `useFetchData`).
- **Variables & Functions**: `camelCase` (e.g., `handleSubmit`).
- **Constants & Static Data**: `UPPER_SNAKE_CASE` (e.g., `API_URL`).

All code follows these conventions to ensure consistency and readability.

### Code Organization

- Group related functionality into folders (e.g., `flows`, `news`, `posts`).
- Use React Query for data fetching and caching.
- Write reusable components and templates to reduce duplication.
- Follow TypeScript conventions for type definitions.

## Development Guidelines

### Routing (`app/`)

- Place all route files under `app/`, named in **kebab-case**.
- Group related routes into folders for clarity.

### Source Code (`src/`)

- **assets/**: Store static assets (images, fonts).

- **components/ui/**: Single-purpose UI components; name files in **kebab-case**, component names in **PascalCase**. \*\*: Reusable atomic elements (Button, Input, ThemedText).

- **components/containers/**: Screen sections; file names in **kebab-case**, component names with `Container` suffix. \*\*: Handle business logic for sections of a screen (ChatContainer, ContractsListContainer).

- **components/layouts/**: Layout components; file names in **kebab-case**, component names with `Layout` suffix. \*\*: Page wrappers that enforce consistent structure (e.g., `TenantAwareLayout`).

- **components/templates/**: Template components; file names in **kebab-case**, component names with `Template` suffix.
- **config/**: Configuration files (e.g., `api-config.ts`).
- **constants/**: Global constants; file names in **kebab-case**, constants in **UPPER_SNAKE_CASE**.
- **context/**: React contexts; file names in **kebab-case**, context names with `Context` suffix.
- **data/**: Domain-specific datasets or configuration arrays/objects that may change over time; file names in **kebab-case**, exports in **UPPER_SNAKE_CASE**. Data files represent mutable collections, whereas `constants/` contains immutable values that do not change.
- **hooks/**: Custom hooks; file names in **kebab-case**, hook names in **camelCase** with `use` prefix.
- **services/**: API services; file names in **kebab-case** with `service` suffix. Export service logic as custom hooks, not just direct React Query hooks. For example:

  ```ts
  export const useSignInService = (
    options?: UseMutationOptions<
      TSignInResultSuccess,
      TApiError,
      TSignInPayload
    >
  ) => {
    const { mutateAsync, isPending, reset, ...rest } = useMutation({
      mutationFn: async (variables) => {
        const { data } = await fetchWrapper(
          "/Huurder/authentication/login",
          { method: "POST", body: variables, skipAuth: true },
          false
        );
        return data;
      },
      mutationKey: ["signin"],
      onError: handleError,
      ...options,
    });

    return {
      signIn: mutateAsync,
      signInLoading: isPending,
      signInReset: reset,
      ...rest,
    };
  };
  ```

  This pattern wraps React Query’s `useMutation` (or `useQuery`) to provide a service-specific API.

- **types/**: Global type definitions; file names in **kebab-case** ending `.d.ts`, interfaces start with `I`, types start with `T`.
- **utils/**: Helper functions; file names in **kebab-case**, exports in **camelCase**.

## API Used / Reference

The app interacts with the following APIs:

- **Authentication API**: `/Huurder/authentication/login`
- **Flow API**: `/Huurder/flow/{code}/definition`, `/Huurder/flow/{code}/initFromProcess`
- **Repair API**: `/Huurder/repair/{id}`
- **News API**: `/Huurder/news`
- **Financial API**: `/Huurder/financial/{id}`

Refer to the **services/** folder for detailed implementations.

## Libraries Used

The app uses the following libraries:

- **React Native**: Core framework for building the app.
- **Expo**: Development platform for React Native apps.
- **React Query**: Data fetching and caching.
- **Axios**: HTTP client for API calls.
- **AsyncStorage**: Persistent storage for user data.
- **React Navigation**: Routing and navigation.
- **@tanstack/react-query**: Advanced query management.
- **@expo/vector-icons**: Icon library for UI components.
- **react-native-webview**: WebView for rendering web content.

## Branching & Deployment

The project uses **GitHub Actions** for CI/CD, integrated with **EAS (Expo Application Services)** to build and release the app.

### Deployment Channels

We support two main environments: **Staging** (Internal Testing) and **Production** (App Store / Google Play).

| Environment        | Branch Pattern      | Action                             | Build Profile | EAS Channel  |
| ------------------ | ------------------- | ---------------------------------- | ------------- | ------------ |
| **Production**     | `release/*`         | Builds & Submits to Stores         | `production`  | `production` |
| **Staging**        | `staging-release/*` | Builds & Submits to Internal Track | `staging`     | `staging`    |
| **Prod Update**    | `updates/*`         | Publishes OTA Update               | `production`  | `production` |
| **Staging Update** | `staging-updates/*` | Publishes OTA Update               | `staging`     | `staging`    |

### 1. Full Release (Native Build + Submission)

Use this when you have native code changes (new libraries, permissions, config changes) or want to release a new binary version to the stores.

**Production:**

1. Create a branch: `release/1.0.0` (replace `1.0.0` with your version).
2. Push to GitHub.
3. **GitHub Action** will:
   - Extract version `1.0.0`.
   - Update `app.json`.
   - Run `npm run submit:android` and `npm run submit:ios`.
   - Create a PR merging this release back to `develop`.

**Staging:**

1. Create a branch: `staging-release/1.0.0`.
2. Push to GitHub.
3. **GitHub Action** will:
   - Run `npm run submit:staging:android` and `npm run submit:staging:ios`.
   - Submits to **Internal Testing** tracks.

### 2. OTA Updates (JavaScript Only)

Use this for quick bug fixes or UI changes that do _not_ touch native code.

**Production:**

1. Create a branch: `updates/1.0.0/fix-login-bug`.
2. Push to GitHub.
3. **GitHub Action** will:
   - Run `npm run update:prod`.
   - Publish to the `production` channel.
   - Users get the update on next restart.

**Staging:**

1. Create a branch: `staging-updates/1.0.0/test-new-feature`.
2. Push to GitHub.
3. **GitHub Action** will:
   - Run `npm run update:staging`.
   - Publish to the `staging` channel.

### Manual Commands

You can also run these commands locally if you have the EAS CLI installed and configured.

- **Build & Submit Production**: `npm run submit:android` / `npm run submit:ios`
- **Build & Submit Staging**: `npm run submit:staging:android` / `npm run submit:staging:ios`
- **Publish Update Production**: `npm run update:prod`
- **Publish Update Staging**: `npm run update:staging`
- **Build Locally (Dev Client)**: `npm run build:local:android` / `npm run build:local:ios`

## What Does It Affect

The app affects the following areas:

- **Tenant Experience**: Simplifies interactions with housing corporations.
- **Corporation Operations**: Streamlines workflows such as contract management and repair requests.
- **Communication**: Improves communication between tenants and corporations.
- **Financial Transactions**: Provides secure and efficient payment options.

1. **Create a branch** from `develop` using the appropriate prefix and your task number:
   ```bash
   # Prefix examples: feat (feature), fix (bug fix), chore (maintenance), refactor, docs, test
   git checkout develop
   git pull
   git checkout -b <prefix>/<task-number>-<short-description>
   ```
   - Example: `git checkout -b fix/1234-correct-login-bug`
2. **Implement changes** and **push** your branch:
   ```bash
   git push origin <prefix>/<task-number>-<short-description>
   ```
3. **Open a Pull Request** against `develop`, requesting review from Steven Benedict and Rick.
4. **Merge** into `develop` after approval.
5. **Weekly Deployment**: Merged changes in `develop` are synced to `master` and deployed via Expo Dev.

## Testing Guide

### In-App Stress Testing

The app includes a comprehensive stress testing system that automatically tests all screens and components for performance, scroll behavior, and navigation.

#### Enabling Stress Testing

The stress test indicator is only visible when:

1. Running in development mode (`__DEV__ === true`)
2. Environment variable `EXPO_PUBLIC_TEST_MODE=true` is set

**Setup Options:**

1. **Using `.env` file** (Recommended):

   ```bash
   EXPO_PUBLIC_TEST_MODE=true
   ```

2. **Using command line**:
   ```bash
   EXPO_PUBLIC_TEST_MODE=true npx expo start
   ```

#### Using the Stress Test

1. **Start the app** with `EXPO_PUBLIC_TEST_MODE=true`
2. **Look for the indicator** at the bottom of the screen (similar to the update download indicator)
3. **Tap "Run Stress Test"** to start comprehensive testing
4. **View results** in the modal that appears after testing completes
5. **Export results** using the "Download PDF" button

#### What Gets Tested

The stress test automatically tests:

- **Performance Metrics**:

  - Render times (average, max, min)
  - Slow renders (>16ms threshold for 60 FPS)
  - Frame drops and performance degradation

- **Scroll Testing**:

  - Programmatic scrolling through lists
  - Scroll to end functionality
  - Scroll performance during navigation

- **Detail Screen Navigation**:

  - Automatic navigation to detail screens when items are found
  - Detail screen render performance
  - Navigation back to list screens

- **Tab Navigation**:
  - Testing different tabs on screens that have them (Cases, Invoices)
  - Tab switching performance

#### Screens Tested

The following screens are automatically tested:

**List Screens** (with performance metrics):

- Home Screen
- Posts List
- Cases List (with tabs: Alle, Open, Opgelost)
- Flows List
- News List
- Contracts List
- Invoices List (with tabs: Alle, Openstaand)
- Repairs Screen
- Unfinished Flows
- Chat Screen

**Static Screens** (no performance metrics required):

- Account Screen
- Contact Screen
- Settings Screen
- Financial Screen

#### Understanding Test Results

Each screen test result includes:

- **Status**: ✅ PASSED, ⚠️ WARNING, or ❌ FAILED
- **Performance Metrics**:
  - Average render time (threshold: ≤16ms for 60 FPS)
  - Maximum render time (threshold: ≤50ms)
  - Slow render percentage (threshold: ≤10%)
- **Test Coverage**:
  - Scroll tested: Whether scrolling was successfully tested
  - Detail screen tested: Whether detail navigation was tested
- **Duration**: Total time taken to test the screen

**Status Meanings**:

- **✅ PASSED**: All performance metrics meet standards
- **⚠️ WARNING**: 1 performance metric failed, but screen is usable
- **❌ FAILED**: 2+ performance metrics failed or critical error occurred

#### Disabling Stress Testing

To disable the stress test indicator:

- Remove `EXPO_PUBLIC_TEST_MODE` from your `.env` file, OR
- Set `EXPO_PUBLIC_TEST_MODE=false`, OR
- Don't set the variable at all

The indicator will automatically hide when the environment variable is not set to `"true"`.

## Error Boundaries

The app uses React Error Boundaries to prevent crashes and provide graceful error handling. When a component encounters an error, instead of crashing the entire app, the error boundary catches it and displays a user-friendly fallback UI.

### What Are Error Boundaries?

Error boundaries are React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of crashing the app.

### How It Works in This App

**Component-Level Error Boundaries** are strategically placed around important containers and screens:

- **List Containers**: All major list containers (Posts, Cases, News, Contracts, Invoices, Flows) are wrapped with error boundaries
- **Detail Screens**: Post and News detail screens have error boundaries
- **Home Screen**: Home screen containers (Contracts, Flows, News) are protected
- **Complex Components**: Chat, Flow detail screens, and other complex components are wrapped

### User Experience

When an error occurs:

1. **Error is Caught**: The error boundary catches the error before it crashes the app
2. **Fallback UI Shown**: A user-friendly error message is displayed in Dutch
3. **Retry Option**: Users can tap "Opnieuw proberen" (Try Again) to retry loading the component
4. **App Continues**: Other parts of the app continue to work normally

### For Developers

#### Adding Error Boundaries to New Components

Use the `WithErrorBoundary` wrapper component:

```tsx
import { WithErrorBoundary } from "@/components/ui/with-error-boundary";

<WithErrorBoundary
  resetKeys={[searchQuery, userId]} // Auto-reset when these change
  title="Kan component niet laden"
  description="Er is een fout opgetreden bij het laden van dit component."
>
  <YourComponent />
</WithErrorBoundary>;
```

#### Best Practices

**Do wrap:**

- Data-fetching containers (list containers)
- Complex forms
- Third-party components
- Isolated features that can fail independently

**Don't wrap:**

- Every small component (adds overhead)
- Simple presentational components
- Components that should propagate errors to parent

#### Using resetKeys

The `resetKeys` prop allows automatic recovery when dependencies change:

```tsx
<WithErrorBoundary
  resetKeys={[searchQuery, userId]} // Resets when searchQuery or userId changes
>
  <Component searchQuery={searchQuery} userId={userId} />
</WithErrorBoundary>
```

When any value in `resetKeys` changes, the error boundary automatically resets, allowing the component to retry rendering.

#### Custom Error Messages

You can customize the error message shown to users:

```tsx
<WithErrorBoundary
  title="Custom Title"
  description="Custom error description in Dutch"
  actionText="Custom Button Text"
>
  <YourComponent />
</WithErrorBoundary>
```

### Testing Error Boundaries

To test error boundaries:

1. **Temporarily add an error** in a component:

   ```tsx
   if (__DEV__) {
     throw new Error("Test error");
   }
   ```

2. **Verify the fallback UI** appears instead of crashing

3. **Test the retry button** to ensure it works correctly

4. **Remove the test error** before committing

### Current Implementation

Error boundaries are currently implemented for:

- ✅ Posts List & Detail
- ✅ Cases List (with tabs)
- ✅ News List & Detail
- ✅ Contracts List
- ✅ Invoices List (with tabs)
- ✅ Flows List & Detail
- ✅ Chat Screen
- ✅ Home Screen containers
- ✅ Unfinished Flows

---

> _Happy coding!_
