import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/layout";
import MainTabs from "./components/tabs";
import Connections from "./pages/connections/connections";
import ConnectionFullView from "./pages/connections/connectionView";
import { Toaster } from "sonner";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <MainTabs />
        <Connections />
      </>
    ),
  },
  {
    path: "/connection",
    element: <h1>Connection</h1>,
  },
  {
    path: "/connection/:id",
    element: <ConnectionFullView />,
  },
]);

export default function App() {
  return (
    <>
      <Layout>
        <Toaster richColors />
        <RouterProvider router={router} />
      </Layout>
    </>
  );
}
