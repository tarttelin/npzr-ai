import React from 'react';
import { Router, Route } from 'wouter';
import { LoggerProvider, LoggerOutput } from '@npzr/ui-react';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/HomePage/HomePage';
import { GamePage } from './pages/GamePage/GamePage';
import { RulesPage } from './pages/RulesPage/RulesPage';
import './App.css';

export const App: React.FC = () => {
  return (
    <LoggerProvider defaultLevel="debug" defaultVisible={false}>
      <Router>
        <Layout>
          <Route path="/" component={HomePage} />
          <Route path="/game" component={GamePage} />
          <Route path="/rules" component={RulesPage} />
          
          {/* 404 route */}
          <Route>
            <div className="not-found">
              <div className="container">
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <a href="/" className="btn-primary">Go Home</a>
              </div>
            </div>
          </Route>
        </Layout>
        
        <LoggerOutput 
          position="top-right"
          width={600}
          height={400}
        />
      </Router>
    </LoggerProvider>
  );
};

export default App;