import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext'; // Import AuthContext
import './ProjectColaborationAi.css';

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

  // Base URL for API endpoints
  const BASE_URL = 'https://flashcards-2iat.onrender.com/projectcollaborationai';

  // Function to get the authentication token
  const getAuthToken = useCallback(async () => {
    if (currentUser) {
      return await currentUser.getIdToken(); // Get the Firebase ID token
    }
    return null;
  }, [currentUser]);

  // Fetch projects from backend
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.get(`${BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` }, // Send the token in the header
      });
      setProjects(response.data.data || []); // Ensure projects is an array
      setError(null); // Clear any previous errors on success
    } catch (err) {
      setError('Failed to load projects');
      setProjects([]); // Reset projects on error
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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

  return (
    <div className="project-collaboration-ai">
      <h1>Project Collaboration AI</h1>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      

      {/* Project List */}
      <div className="project-list">
        <h2>Projects</h2>
        {projects.map((project) => (
          <div key={project._id} className="project-item">
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <button onClick={() => fetchTasks(project._id)}>View Tasks</button>
            <button onClick={() => deleteProject(project._id)} disabled={loading}>
              Delete Project
            </button>
            <div className="add-collaborator">
              <input
                type="email"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                placeholder="Add collaborator by email"
                disabled={loading}
              />
              <button onClick={() => addCollaborator(project._id)} disabled={loading}>
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        ))}
      </div>

      
      {/* Task List */}
      <div className="task-list">
        <h2>Tasks</h2>
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
      <div className="ai-suggestions">
        <h2>AI Suggestions</h2>
        <button onClick={generateSuggestions} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Suggestions'}
        </button>
        {suggestions.map((suggestion, index) => (
          <p key={index}>{suggestion}</p>
        ))}
      </div>

      {/* Generate Report */}
      <div className="generate-report">
        <h2>Generate Project Report</h2>
        <button onClick={generateReport} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Project Form */}
      <div className="project-form">
        <h2>Add New Project</h2>
        <input
          type="text"
          value={newProject.name}
          onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          placeholder="Project name"
          disabled={loading}
        />
        <textarea
          value={newProject.description}
          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          placeholder="Project description"
          disabled={loading}
        />
        <input
          type="text"
          value={newProject.objectives.join(', ')}
          onChange={(e) => setNewProject({ ...newProject, objectives: e.target.value.split(', ') })}
          placeholder="Project objectives (comma separated)"
          disabled={loading}
        />
        <button onClick={addProject} disabled={loading}>
          {loading ? 'Adding...' : 'Add Project'}
        </button>
      </div>

      {/* Task Form */}
      <div className="task-form">
        <h2>Add New Task</h2>
        <input
          type="text"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          placeholder="Task title"
          disabled={loading}
        />
        <textarea
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          placeholder="Task description"
          disabled={loading}
        />
        <input
          type="date"
          value={newTask.dueDate}
          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
          disabled={loading}
        />
        <select
          value={newTask.priority}
          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
          disabled={loading}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select
          value={newTask.projectId}
          onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
          disabled={loading}
        >
          <option value="">Select Project</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>{project.name}</option>
          ))}
        </select>
        <button onClick={addTask} disabled={loading}>
          {loading ? 'Adding...' : 'Add Task'}
        </button>
      </div>
    </div>
  );
};

export default ProjectCollaborationAi;