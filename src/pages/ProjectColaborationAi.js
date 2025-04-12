import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext'; // Import AuthContext
import './ProjectColaborationAi.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const ProjectCollaborationAi = () => {
  const { currentUser } = useContext(AuthContext); // Access currentUser from AuthContext
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', priority: 'medium', assignee: '', projectId: '' });
  const [newProject, setNewProject] = useState({ name: '', description: '', objectives: [] });
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState({});
  const [attachments, setAttachments] = useState({});
  const [activeTab, setActiveTab] = useState('projects'); // Add state for active tab
  const [aiQuery, setAiQuery] = useState(''); // Add state for AI query
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [collaborators, setCollaborators] = useState([]);

  // Base URL for API endpoints
  const BASE_URL = 'https://flashcards-2iat.onrender.com/projectcollaborationai';

  // Function to get the authentication token
  const getAuthToken = useCallback(async () => {
    if (currentUser) {
      return await currentUser.getIdToken(); // Get the Firebase ID token
    }
    return null;
  }, [currentUser]);

  // Fetch collaborators for a project
  const fetchCollaborators = useCallback(async (projectId) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.get(`${BASE_URL}/projects/${projectId}/collaborators`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCollaborators(response.data.data || []);
    } catch (err) {
      setError('Failed to load collaborators');
      setCollaborators([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  // Fetch projects from backend
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.get(`${BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` }, // Send the token in the header
      });
      const fetchedProjects = response.data.data || [];
      setProjects(fetchedProjects);
      setError(null);
      
      // Now we can safely call fetchCollaborators since it's defined above
      if (fetchedProjects.length > 0) {
        fetchCollaborators(fetchedProjects[0]._id);
      }
    } catch (err) {
      setError('Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, fetchCollaborators]);

  // Fetch tasks for a project from backend
  const fetchTasks = useCallback(async (projectId) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.get(`${BASE_URL}/projects/${projectId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data.data || []); // Ensure tasks is an array
      setError(null); // Clear any previous errors on success
    } catch (err) {
      setError('Failed to load tasks');
      setTasks([]); // Reset tasks on error
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handle server restart
  useEffect(() => {
    const handleServerRestart = () => {
      fetchProjects(); // Refetch projects when the server restarts
    };

    // Listen for server restart events (e.g., when the server reconnects)
    window.addEventListener('online', handleServerRestart);

    // Cleanup event listener
    return () => {
      window.removeEventListener('online', handleServerRestart);
    };
  }, [fetchProjects]);

  // Add a new project
  const addProject = async () => {
    if (newProject.name.trim() === '') return;
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(
        `${BASE_URL}/projects`,
        { ...newProject, userId: currentUser.uid },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProjects([...projects, response.data.data]);
      setNewProject({ name: '', description: '', objectives: [] });
    } catch (err) {
      setError('Failed to add project');
    } finally {
      setLoading(false);
    }
  };

  // Add a new task
  const addTask = async () => {
    if (newTask.title.trim() === '') return;
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(
        `${BASE_URL}/tasks`,
        { ...newTask, userId: currentUser.uid },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTasks([...tasks, response.data.data]);
      setNewTask({ title: '', description: '', dueDate: '', priority: 'medium', assignee: '', projectId: '' });
    } catch (err) {
      setError('Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  // Add a collaborator to a project
  const addCollaborator = async (projectId) => {
    if (!collaboratorEmail.trim()) return;
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(
        `${BASE_URL}/projects/${projectId}/add-collaborator`,
        { email: collaboratorEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Use the response data to update the projects list
      if (response.data.data) {
        // Update the projects array with the updated project that has new collaborator
        setProjects(
          projects.map(p => p._id === projectId ? response.data.data : p)
        );
        // Refresh collaborators if needed
        fetchCollaborators(projectId);
      }
      
      setCollaboratorEmail('');
      setError(null);
    } catch (err) {
      setError('Failed to add collaborator');
    } finally {
      setLoading(false);
    }
  };

  // Delete a project
  const deleteProject = async (projectId) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      await axios.delete(`${BASE_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(projects.filter(project => project._id !== projectId));
    } catch (err) {
      setError('Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  // Toggle task status
  const toggleTaskStatus = async (taskId, status) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.put(`${BASE_URL}/tasks/${taskId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.map(task => (task._id === taskId ? response.data.data : task)));
    } catch (err) {
      setError('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  // Add a comment to a task
  const addComment = async (taskId, comment) => {
    if (!comment.trim()) return;
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(`${BASE_URL}/tasks/${taskId}/comments`, { comment }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.map(task => (task._id === taskId ? response.data.data : task)));
      setComments({ ...comments, [taskId]: '' }); // Clear the comment input
    } catch (err) {
      setError('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  // Add an attachment to a task
  const addAttachment = async (taskId, attachment) => {
    if (!attachment) return;
    try {
      setLoading(true);
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('file', attachment);
      const response = await axios.post(`${BASE_URL}/tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setTasks(tasks.map(task => (task._id === taskId ? response.data.data : task)));
    } catch (err) {
      setError('Failed to add attachment');
    } finally {
      setLoading(false);
    }
  };

  // Generate AI suggestions
  const generateSuggestions = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(`${BASE_URL}/generate-suggestions`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuggestions(response.data.data?.suggestions || []); // Ensure suggestions is an array
    } catch (err) {
      setError('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Generate AI report
  const generateReport = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(`${BASE_URL}/generate-report`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(response.data.data?.report || 'No report generated'); // Ensure report exists
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Ask AI a question
  const askAiQuestion = async () => {
    if (!aiQuery.trim()) return;
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(`${BASE_URL}/ask-ai`, { query: aiQuery }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuggestions([...suggestions, response.data.data?.answer || 'No answer provided']); // Ensure answer exists
      setAiQuery(''); // Clear the AI query input
    } catch (err) {
      setError('Failed to ask AI');
    } finally {
      setLoading(false);
    }
  };

  // Toggle project form visibility
  const toggleProjectForm = () => {
    setShowProjectForm(!showProjectForm);
    if (editingProject) setEditingProject(null);
  };

  // Toggle task form visibility
  const toggleTaskForm = () => {
    setShowTaskForm(!showTaskForm);
  };

  // Update existing project
  const updateProject = async () => {
    if (!editingProject || editingProject.name.trim() === '') return;
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.put(
        `${BASE_URL}/projects/${editingProject._id}`,
        editingProject,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Update projects array with edited project
      setProjects(projects.map(p => 
        p._id === editingProject._id ? response.data.data : p
      ));
      
      // Reset form and close modal
      setEditingProject(null);
      setShowProjectForm(false);
    } catch (err) {
      setError('Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-collaboration-ai">
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Project Collaboration AI</h1>
          <div className="quick-actions">
            <button className="primary-button" onClick={toggleProjectForm}>
              <span className="material-icons">add</span> New Project
            </button>
            <button className="secondary-button" onClick={generateReport}>
              <span className="material-icons">assessment</span> Generate Report
            </button>
          </div>
        </div>
        
        <div className="tab-navigation">
          <button 
            className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <span className="material-icons">folder</span> Projects
          </button>
          <button 
            className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <span className="material-icons">task</span> Tasks
          </button>
          <button 
            className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <span className="material-icons">psychology</span> AI Assistant
          </button>
          <button 
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="material-icons">insights</span> Analytics
          </button>
        </div>

        <div className="kpi-cards">
          <div className="kpi-card">
            <span className="kpi-number">{projects.length}</span>
            <span className="kpi-label">Active Projects</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-number">{tasks.filter(t => t.status === 'done').length}</span>
            <span className="kpi-label">Completed Tasks</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-number">{tasks.filter(t => new Date(t.dueDate) < new Date()).length}</span>
            <span className="kpi-label">Overdue Tasks</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-number">{collaborators.length}</span>
            <span className="kpi-label">Team Members</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Project List */}
      {activeTab === 'projects' && (
        <div className="project-grid">
          {projects.map((project) => (
            <div key={project._id} className="project-card">
              <div className="project-card-header">
                <h3>{project.name}</h3>
                <div className="project-menu">
                  <button className="icon-button">
                    <span className="material-icons">more_vert</span>
                  </button>
                  <div className="dropdown-menu">
                    <button onClick={() => fetchTasks(project._id)}>View Tasks</button>
                    <button onClick={() => setEditingProject(project)}>Edit</button>
                    <button onClick={() => deleteProject(project._id)} className="danger">Delete</button>
                  </div>
                </div>
              </div>
              
              <p className="project-description">{project.description}</p>
              
              <div className="project-stats">
                <div className="stat">
                  <span className="stat-value">
                    {tasks.filter(t => t.projectId === project._id).length}
                  </span>
                  <span className="stat-label">Tasks</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {tasks.filter(t => t.projectId === project._id && t.status === 'done').length}
                  </span>
                  <span className="stat-label">Completed</span>
                </div>
              </div>
              
              <div className="project-progress">
                <div className="progress-label">
                  <span>Progress</span>
                  <span>
                    {Math.round((tasks.filter(t => t.projectId === project._id && t.status === 'done').length / 
                      Math.max(1, tasks.filter(t => t.projectId === project._id).length)) * 100)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.round((tasks.filter(t => t.projectId === project._id && t.status === 'done').length / 
                        Math.max(1, tasks.filter(t => t.projectId === project._id).length)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="collaborators">
                {/* Show existing collaborators */}
                {(project.collaborators || []).map((collaborator, index) => (
                  <div key={index} className="collaborator-avatar" title={collaborator.name || collaborator.email}>
                    {collaborator.name ? collaborator.name.charAt(0) : collaborator.email.charAt(0)}
                  </div>
                ))}
                
                {/* Collaborator add button */}
                <div className="add-collaborator-section">
                  <input
                    type="email"
                    placeholder="Collaborator email"
                    value={collaboratorEmail}
                    onChange={(e) => setCollaboratorEmail(e.target.value)}
                  />
                  <button 
                    className="add-collaborator-button"
                    onClick={() => addCollaborator(project._id)}
                    disabled={loading || !collaboratorEmail.trim()}
                  >
                    <span className="material-icons">person_add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="add-project-card" onClick={toggleProjectForm}>
            <span className="material-icons">add</span>
            <span>New Project</span>
          </div>
        </div>
      )}

      {/* Task List */}
      {activeTab === 'tasks' && (
        <div className="task-list">
          <div className="task-section-header">
            <h2>Tasks</h2>
            <button className="add-task-button" onClick={toggleTaskForm}>
              <span className="material-icons">add_task</span> New Task
            </button>
          </div>
          {tasks.map((task) => (
            <div key={task._id} className="task-item">
              <select
                value={task.status}
                onChange={(e) => toggleTaskStatus(task._id, e.target.value)}
                disabled={loading}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <span className={task.status === 'done' ? 'completed' : ''}>
                {task.title}
              </span>
              <button onClick={() => setSelectedTask(task)}>View Details</button>
            </div>
          ))}
        </div>
      )}

      {/* Task Details */}
      {selectedTask && (
        <div className="task-details">
          <h2>{selectedTask.title}</h2>
          <p>{selectedTask.description}</p>
          <p>Due Date: {selectedTask.dueDate}</p>
          <p>Priority: {selectedTask.priority}</p>
          <p>Assignee: {selectedTask.assignee}</p>
          <p>Project: {projects.find(project => project._id === selectedTask.projectId)?.name}</p>
          <div className="comments">
            <h3>Comments</h3>
            {(selectedTask.comments || []).map((comment, index) => (
              <p key={index}>{comment}</p>
            ))}
            <textarea
              placeholder="Add a comment"
              value={comments[selectedTask._id] || ''}
              onChange={(e) => setComments({ ...comments, [selectedTask._id]: e.target.value })}
            />
            <button onClick={() => addComment(selectedTask._id, comments[selectedTask._id])}>
              Add Comment
            </button>
          </div>
          <div className="attachments">
            <h3>Attachments</h3>
            {(selectedTask.attachments || []).map((attachment, index) => (
              <p key={index}>{attachment}</p>
            ))}
            <input
              type="file"
              onChange={(e) => setAttachments({ ...attachments, [selectedTask._id]: e.target.files[0] })}
            />
            <button onClick={() => addAttachment(selectedTask._id, attachments[selectedTask._id])}>
              Add Attachment
            </button>
          </div>
          <button onClick={() => setSelectedTask(null)}>Close</button>
        </div>
      )}

      {/* AI Suggestions */}
      {activeTab === 'ai' && (
        <div className="ai-suggestions">
          <h2>AI Suggestions</h2>
          <button onClick={generateSuggestions} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Suggestions'}
          </button>
          {suggestions.map((suggestion, index) => (
            <p key={index}>{suggestion}</p>
          ))}
        </div>
      )}

      {/* AI Assistant Panel */}
      {activeTab === 'ai' && (
        <div className="ai-assistant-panel">
          <div className="assistant-header">
            <h2>AI Project Assistant</h2>
            <button onClick={generateSuggestions} className="refresh-button">
              <span className="material-icons">refresh</span>
            </button>
          </div>
          
          <div className="assistant-chat">
            <div className="chat-message assistant">
              <div className="avatar">AI</div>
              <div className="message-content">
                <p>Hello! I've analyzed your projects and have some suggestions:</p>
              </div>
            </div>
            
            {suggestions.map((suggestion, index) => (
              <div key={index} className="chat-message assistant">
                <div className="avatar">AI</div>
                <div className="message-content">
                  <p>{suggestion}</p>
                  <div className="suggestion-actions">
                    <button>Apply</button>
                    <button>Dismiss</button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="chat-input">
              <input 
                type="text" 
                placeholder="Ask the AI assistant a question..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
              />
              <button onClick={askAiQuestion}>
                <span className="material-icons">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report */}
      {activeTab === 'analytics' && (
        <div className="generate-report">
          <h2>Generate Project Report</h2>
          <button onClick={generateReport} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      )}

      {/* Analytics Dashboard */}
      {activeTab === 'analytics' && (
        <div className="analytics-dashboard">
          <div className="analytics-card">
            <h3>Task Status Distribution</h3>
            <div className="chart-container">
              <PieChart width={300} height={300}>
                <Pie
                  data={[
                    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#4299E1' },
                    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#ECC94B' },
                    { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: '#48BB78' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {tasks.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </div>
          
          <div className="analytics-card">
            <h3>Task Completion by Project</h3>
            <div className="chart-container">
              <BarChart width={500} height={300} data={projects.map(project => ({
                name: project.name,
                total: tasks.filter(t => t.projectId === project._id).length,
                completed: tasks.filter(t => t.projectId === project._id && t.status === 'done').length
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#4299E1" name="Total Tasks" />
                <Bar dataKey="completed" fill="#48BB78" name="Completed Tasks" />
              </BarChart>
            </div>
          </div>
        </div>
      )}

      {/* Project Form */}
      {showProjectForm && (
        <div className="project-form">
          <h2>{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
          {/* ...rest of form content... */}
          <div className="form-actions">
            <button onClick={editingProject ? updateProject : addProject} disabled={loading}>
              {loading ? (editingProject ? 'Updating...' : 'Adding...') : (editingProject ? 'Update Project' : 'Add Project')}
            </button>
            <button className="cancel-button" onClick={toggleProjectForm}>Cancel</button>
          </div>
        </div>
      )}

      {/* Task Form */}
      {showTaskForm && (
        <div className="form-overlay">
          <div className="task-form">
            <div className="form-header">
              <h2>Add New Task</h2>
              <button className="close-button" onClick={toggleTaskForm}>
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="form-fields">
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Enter task title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Describe this task"
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Priority</label>
                <select 
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Assignee</label>
                <input
                  type="text"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                  placeholder="Enter assignee name"
                />
              </div>
              
              <div className="form-group">
                <label>Project</label>
                <select 
                  value={newTask.projectId}
                  onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-actions">
              <button className="cancel-button" onClick={toggleTaskForm}>
                Cancel
              </button>
              <button 
                className="submit-button"
                onClick={addTask} 
                disabled={loading || !newTask.title.trim() || !newTask.projectId}
              >
                {loading ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="kanban-board">
        <div className="kanban-column">
          <div className="column-header">
            <h3>To Do</h3>
            <span className="task-count">{tasks.filter(t => t.status === 'todo').length}</span>
          </div>
          <div className="column-tasks">
            {tasks.filter(t => t.status === 'todo').map(task => (
              <div key={task._id} className="task-card" onClick={() => setSelectedTask(task)}>
                <div className={`priority-indicator priority-${task.priority}`}></div>
                <h4>{task.title}</h4>
                <p className="task-description">{task.description.substring(0, 60)}...</p>
                <div className="task-meta">
                  <span className="due-date">
                    <span className="material-icons">event</span>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                  <span className="assignee">
                    <span className="material-icons">person</span>
                    {task.assignee || 'Unassigned'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Repeat for "In Progress" and "Done" columns */}
      </div>

      {/* Project Form Modal */}
      {showProjectForm && (
        <div className="form-overlay">
          <div className="project-form">
            <div className="form-header">
              <h2>{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
              <button className="close-button" onClick={toggleProjectForm}>
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="form-fields">
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={editingProject ? editingProject.name : newProject.name}
                  onChange={(e) => editingProject 
                    ? setEditingProject({...editingProject, name: e.target.value})
                    : setNewProject({...newProject, name: e.target.value})
                  }
                  placeholder="Enter project name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingProject ? editingProject.description : newProject.description}
                  onChange={(e) => editingProject
                    ? setEditingProject({...editingProject, description: e.target.value})
                    : setNewProject({...newProject, description: e.target.value})
                  }
                  placeholder="Describe this project"
                  rows={4}
                />
              </div>
              
              <div className="form-group">
                <label>Objectives</label>
                <div className="objective-list">
                  {(editingProject ? editingProject.objectives : newProject.objectives).map((objective, index) => (
                    <div key={index} className="objective-item">
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => {
                          const updatedObjectives = [...(editingProject ? editingProject.objectives : newProject.objectives)];
                          updatedObjectives[index] = e.target.value;
                          editingProject
                            ? setEditingProject({...editingProject, objectives: updatedObjectives})
                            : setNewProject({...newProject, objectives: updatedObjectives});
                        }}
                        placeholder="Project objective"
                      />
                      <button 
                        className="remove-button"
                        onClick={() => {
                          const updatedObjectives = [...(editingProject ? editingProject.objectives : newProject.objectives)];
                          updatedObjectives.splice(index, 1);
                          editingProject
                            ? setEditingProject({...editingProject, objectives: updatedObjectives})
                            : setNewProject({...newProject, objectives: updatedObjectives});
                        }}
                      >
                        <span className="material-icons">remove_circle</span>
                      </button>
                    </div>
                  ))}
                  <button 
                    className="add-objective-button"
                    onClick={() => {
                      const updatedObjectives = [...(editingProject ? editingProject.objectives : newProject.objectives), ''];
                      editingProject
                        ? setEditingProject({...editingProject, objectives: updatedObjectives})
                        : setNewProject({...newProject, objectives: updatedObjectives});
                    }}
                  >
                    <span className="material-icons">add</span> Add Objective
                  </button>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                className="cancel-button" 
                onClick={toggleProjectForm}
              >
                Cancel
              </button>
              <button 
                className="submit-button"
                onClick={editingProject ? updateProject : addProject} 
                disabled={loading}
              >
                {loading 
                  ? (editingProject ? 'Updating...' : 'Creating...') 
                  : (editingProject ? 'Update Project' : 'Create Project')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCollaborationAi;