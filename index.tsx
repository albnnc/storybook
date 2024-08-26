import { Global } from "@emotion/react";
import { Fragment } from "react";
import { render } from "react-dom";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "./components/layouts/app.tsx";
import { HomePage } from "./pages/home.tsx";
import { StoryPage } from "./pages/story.tsx";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      {
        path: "/s/:id",
        element: <StoryPage />,
      },
    ],
  },
]);

const App = () => {
  return (
    <Fragment>
      <Global
        styles={{
          html: {
            fontFamily: "Roboto, sans-serif",
          },
          body: {
            padding: 0,
            margin: 0,
          },
          "*": {
            boxSizing: "border-box",
          },
        }}
      />
      <RouterProvider router={router} />
    </Fragment>
  );
};

const root = document.getElementById("root");

render(<App />, root);
