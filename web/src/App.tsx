import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/layout";
import MainTabs from "./components/tabs";
import Connections from "./pages/connections/connections";
import ConnectionFullView from "./pages/connections/connectionView";
import { Toaster } from "sonner";
import Storages from "./pages/storages/storages";

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
    path: "/connection/:id",
    element: <ConnectionFullView />,
  },
  {
    path: "/storage",
    element: (
      <>
        <MainTabs />
        <Storages />
      </>
    ),
  },
  {
    path: "/settings",
    element: <h1>Settings</h1>,
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
