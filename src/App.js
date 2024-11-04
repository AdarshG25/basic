// App.js
import React, { useState, useEffect } from 'react';
import './App.css';

const PRIORITY_MAP = {
  4: { name: 'Urgent', icon: '🔴' },
  3: { name: 'High', icon: '⚡' },
  2: { name: 'Medium', icon: '🎯' },
  1: { name: 'Low', icon: '⏬' },
  0: { name: 'No priority', icon: '❓' }
};

const STATUS_ICONS = {
  'Todo': '⭕',
  'In Progress': '🔄',
  'Done': '✅',
  'Canceled': '❌'
};

function App() {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [displaySettings, setDisplaySettings] = useState(() => {
    const saved = localStorage.getItem('displaySettings');
    return saved ? JSON.parse(saved) : { groupBy: 'status', orderBy: 'priority' };
  });
  const [showDisplayMenu, setShowDisplayMenu] = useState(false);

  useEffect(() => {
    fetchData();
    localStorage.setItem('displaySettings', JSON.stringify(displaySettings));
  }, [displaySettings]);

  const fetchData = async () => {
    try {
      const response = await fetch('https://api.quicksell.co/v1/internal/frontend-assignment');
      const data = await response.json();
      setTickets(data.tickets);
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const groupTickets = () => {
    let grouped = {};
    
    if (displaySettings.groupBy === 'status') {
      grouped = tickets.reduce((acc, ticket) => {
        const status = ticket.status;
        if (!acc[status]) acc[status] = [];
        acc[status].push(ticket);
        return acc;
      }, {});
    } else if (displaySettings.groupBy === 'user') {
      grouped = tickets.reduce((acc, ticket) => {
        const user = users.find(u => u.id === ticket.userId);
        const userName = user ? user.name : 'Unassigned';
        if (!acc[userName]) acc[userName] = [];
        acc[userName].push(ticket);
        return acc;
      }, {});
    } else if (displaySettings.groupBy === 'priority') {
      grouped = tickets.reduce((acc, ticket) => {
        const priority = PRIORITY_MAP[ticket.priority].name;
        if (!acc[priority]) acc[priority] = [];
        acc[priority].push(ticket);
        return acc;
      }, {});
    }

    // Sort tickets within each group
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (displaySettings.orderBy === 'priority') {
          return b.priority - a.priority;
        } else {
          return a.title.localeCompare(b.title);
        }
      });
    });

    return grouped;
  };

  const renderDisplayMenu = () => (
    <div className="display-menu">
      <div className="menu-header">
        <span>Display Settings</span>
      </div>
      <div className="menu-option">
        <span>Grouping</span>
        <select 
          value={displaySettings.groupBy}
          onChange={(e) => setDisplaySettings({...displaySettings, groupBy: e.target.value})}
        >
          <option value="status">Status</option>
          <option value="user">User</option>
          <option value="priority">Priority</option>
        </select>
      </div>
      <div className="menu-option">
        <span>Ordering</span>
        <select
          value={displaySettings.orderBy}
          onChange={(e) => setDisplaySettings({...displaySettings, orderBy: e.target.value})}
        >
          <option value="priority">Priority</option>
          <option value="title">Title</option>
        </select>
      </div>
    </div>
  );

  const renderTicket = (ticket) => {
    const user = users.find(u => u.id === ticket.userId);
    
    return (
      <div key={ticket.id} className="ticket">
        <div className="ticket-header">
          <span className="ticket-id">{ticket.id}</span>
          <div className="user-avatar">
            {user?.name.charAt(0)}
            <span className="status-dot"></span>
          </div>
        </div>
        <div className="ticket-title">
          {STATUS_ICONS[ticket.status]} {ticket.title}
        </div>
        <div className="ticket-tags">
          <div className="tag">
            {PRIORITY_MAP[ticket.priority].icon}
          </div>
          <div className="tag">
            {ticket.tag}
          </div>
        </div>
      </div>
    );
  };

  const groupedTickets = groupTickets();

  return (
    <div className="app">
      <header>
        <button 
          className="display-button"
          onClick={() => setShowDisplayMenu(!showDisplayMenu)}
        >
          Display ⌄
        </button>
        {showDisplayMenu && renderDisplayMenu()}
      </header>
      
      <div className="board">
        {Object.entries(groupedTickets).map(([groupName, tickets]) => (
          <div key={groupName} className="column">
            <div className="column-header">
              <div className="column-title">
                {groupName} {tickets.length}
              </div>
              <div className="column-actions">
                <button>+</button>
                <button>⋯</button>
              </div>
            </div>
            <div className="tickets">
              {tickets.map(renderTicket)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;