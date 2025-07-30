
import { ToastContainer } from 'react-toastify';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
      <>
      <AppRoutes/>
      <ToastContainer
        position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light" // you can use "light" or "dark" if you prefer
      />
      </>
  );
}

export default App;
