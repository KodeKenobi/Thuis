Component-level error boundaries are possible and useful. Here's how to handle them:
Component-level error boundaries
1. Strategic placement
Wrap components that:
Are isolated/independent (e.g., a feed, a chart, a form)
Can fail without breaking the screen
Have their own data fetching
Example:
da
// In a screen<ErrorBoundary   fallback={<ComponentErrorFallback onRetry={refetch} />}  resetKeys={[dataKey]} // Reset when data changes>  <PostListContainer /></ErrorBoundary>
2. Component reload strategies
Option A: Using resetKeys (automatic)
<ErrorBoundary  resetKeys={[userId, refreshKey]} // Resets when these change>  <Component /></ErrorBoundary>
Option B: Using key prop (manual reset)
const [componentKey, setComponentKey] = useState(0);<ErrorBoundary>  <Component key={componentKey} /></ErrorBoundary>// To reload:setComponentKey(prev => prev + 1);
Option C: Custom reset method
class ComponentErrorBoundary extends ErrorBoundary {  resetComponent = () => {    this.setState({ hasError: false, error: null });    // Trigger component remount or state reset  };}
3. Recommended pattern for your app
For containers like PostListContainer, FlowsListContainer, etc.:
// Enhanced ErrorBoundary with reset capability<ErrorBoundary  fallback={({ resetError, error }) => (    <View>      <Text>Something went wrong</Text>      <Button onPress={resetError}>Retry</Button>    </View>  )}  resetKeys={[searchQuery, filters]} // Auto-reset when these change>  <PostListContainer /></ErrorBoundary>
4. Component-level vs screen-level vs root-level
Root ErrorBoundary  └─ Catches: Fatal errors, navigation failures  └─ Action: Full app reloadScreen ErrorBoundary    └─ Catches: Screen-specific errors  └─ Action: Navigate to safe screen, show screen errorComponent ErrorBoundary  └─ Catches: Component-specific errors (data fetching, rendering)  └─ Action: Show fallback UI, retry component, reset component state
5. Best practices
Use component boundaries for:
Data-fetching containers (your list containers)
Complex forms
Third-party components
Isolated features
Don't wrap:
Every small component (overhead)
Simple presentational components
Components that should fail up to parent
Provide recovery:
Retry button (refetch data)
Reset button (clear state and remount)
Fallback UI (show placeholder or alternative content)
6. Implementation example
For your PostListContainer:
// In posts-screen.tsx<ErrorBoundary  fallback={({ resetError }) => (    <Container>      <EmptyData         description="Er is een fout opgetreden bij het laden van berichten."        action={          <Button title="Opnieuw proberen" onPress={resetError} />        }      />    </Container>  )}  resetKeys={[searchQuery]} // Auto-reset when search changes>  <PostListContainer searchQuery={searchQuery} /></ErrorBoundary>
Recommendation
Root boundary: Catches fatal errors
Screen boundaries: For critical screens
Component boundaries: For data containers and complex components
Use resetKeys for automatic recovery when dependencies change
Provide manual retry/reset buttons in fallback UIs
This gives granular recovery without full app reloads. Should I implement this pattern in your app?