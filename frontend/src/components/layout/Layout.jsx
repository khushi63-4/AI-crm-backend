const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <div className="main-content">
        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
