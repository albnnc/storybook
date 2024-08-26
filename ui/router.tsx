import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./layouts/app.tsx";
import { HomePage } from "./pages/home.tsx";
import { StoryPage } from "./pages/story.tsx";

export const router = createBrowserRouter([
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
