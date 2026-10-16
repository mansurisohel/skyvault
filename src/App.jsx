import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary message="SkyVault hit an unexpected problem. Reloading usually fixes it.">
      <Layout>
        <Home />
      </Layout>
    </ErrorBoundary>
  );
}
