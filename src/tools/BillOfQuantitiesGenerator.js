import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './BillOfQuantitiesGenerator.css';

// Helper function to format numbers consistently
const formatNumber = (value) => {
  const number = parseFloat(value);
  return isNaN(number) ? '0.00' : number.toFixed(2);
};

// Helper function to get numeric value safely
const getNumericValue = (value) => {
  const number = parseFloat(value);
  return isNaN(number) ? 0 : number;
};

// Helper function to safely parse float values
const safeParseFloat = (value) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

const BillOfQuantitiesGenerator = () => {
  // Currency conversion
  const exchangeRate = 0.00754; // 1 USD = 132.50 KES (fetch dynamically)
  const [currency, setCurrency] = useState('KES');
  
  // Project Information
  const [projectInfo, setProjectInfo] = useState({
    projectName: '',
    clientName: '',
    projectLocation: '',
    projectDate: '',
    projectNumber: '',
    preparedBy: '',
  });
  
  // Categories (work sections)
  const defaultCategories = [
    { id: 1, name: 'Preliminaries & General' },
    { id: 2, name: 'Earthworks' },
    { id: 3, name: 'Concrete Works' },
    { id: 4, name: 'Masonry & Blockwork' },
    { id: 5, name: 'Carpentry & Joinery' },
    { id: 6, name: 'Roofing' },
    { id: 7, name: 'Finishes' },
    { id: 8, name: 'Plumbing & Drainage' },
    { id: 9, name: 'Electrical Installations' },
    { id: 10, name: 'External Works' },
  ];
  
  const [categories, setCategories] = useState(defaultCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // BOQ Items
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    categoryId: 1,  // This should be a number, not a string
    itemCode: '',
    description: '',
    unit: '',
    quantity: '',
    rate: '',
    amount: 0,
    notes: ''
  });
  
  // Edit mode
  const [editingItemId, setEditingItemId] = useState(null);
  
  // Summary and Totals
  const [summary, setSummary] = useState({
    directCosts: 0,
    contingency: 0,
    contingencyPercentage: 5,
    overheads: 0,
    overheadsPercentage: 10,
    profit: 0,
    profitPercentage: 15,
    taxes: 0,
    taxRate: 16, // VAT in Kenya
    grandTotal: 0
  });
  
  // Helper to generate unique IDs
  const generateId = () => Math.floor(Math.random() * 1000000);
  
  // Update amount when quantity or rate changes
  useEffect(() => {
    // Make sure we're working with numbers, not strings
    const quantity = parseFloat(currentItem.quantity) || 0;
    const rate = parseFloat(currentItem.rate) || 0;
    
    // Calculate the amount and ensure it's a numeric value
    const calculatedAmount = quantity * rate;
    
    // Only update if the amount is actually different to avoid infinite loops
    if (currentItem.amount !== calculatedAmount) {
      setCurrentItem(prev => ({
        ...prev,
        amount: calculatedAmount
      }));
    }
  }, [currentItem.quantity, currentItem.rate, currentItem.amount]);
  
  // Update summary whenever items change
  useEffect(() => {
    // Calculate direct costs from items, ensuring numeric values
    const directCosts = items.reduce((sum, item) => {
      const itemAmount = parseFloat(item.amount) || 0;
      return sum + itemAmount;
    }, 0);
    
    // Calculate other values based on percentages
    const contingencyPercentage = parseFloat(summary.contingencyPercentage) || 0;
    const overheadsPercentage = parseFloat(summary.overheadsPercentage) || 0;
    const profitPercentage = parseFloat(summary.profitPercentage) || 0;
    const taxRate = parseFloat(summary.taxRate) || 0;
    
    const contingency = directCosts * (contingencyPercentage / 100);
    const overheads = directCosts * (overheadsPercentage / 100);
    const profit = directCosts * (profitPercentage / 100);
    const subtotal = directCosts + contingency + overheads + profit;
    const taxes = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxes;
    
    // Update summary with calculated values
    setSummary(prev => ({
      ...prev,
      directCosts,
      contingency,
      overheads,
      profit,
      taxes,
      grandTotal
    }));
  }, [items, summary.contingencyPercentage, summary.overheadsPercentage, summary.profitPercentage, summary.taxRate]);
  
  // Handle input changes for project info
  const handleProjectInfoChange = (e) => {
    setProjectInfo({
      ...projectInfo,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle input changes for current item
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    
    // Convert categoryId to number when it changes
    if (name === 'categoryId') {
      setCurrentItem({
        ...currentItem,
        [name]: parseInt(value, 10)  // Convert to number
      });
    } else {
      setCurrentItem({
        ...currentItem,
        [name]: value
      });
    }
  };
  
  // Handle input changes for summary percentages
  const handleSummaryChange = (e) => {
    setSummary({
      ...summary,
      [e.target.name]: parseFloat(e.target.value) || 0
    });
  };
  
  // Add new category
  const addCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory = {
        id: generateId(),
        name: newCategoryName.trim()
      };
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
    }
  };
  
  // Delete category
  const deleteCategory = (categoryId) => {
    if (window.confirm('Are you sure? This will delete all items in this category.')) {
      setCategories(categories.filter(category => category.id !== categoryId));
      setItems(items.filter(item => item.categoryId !== categoryId));
    }
  };
  
  // Add new item
  const addItem = () => {
    const requiredFields = ['description', 'unit', 'quantity', 'rate'];
    const missingFields = requiredFields.filter(field => !currentItem[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Ensure amount is calculated with numeric values before saving
    const quantity = parseFloat(currentItem.quantity) || 0;
    const rate = parseFloat(currentItem.rate) || 0;
    const calculatedAmount = quantity * rate;
    
    const itemToSave = {
      ...currentItem,
      quantity: quantity,  // Store as number
      rate: rate,          // Store as number
      amount: calculatedAmount  // Ensure calculated correctly
    };
    
    if (editingItemId === null) {
      const newItem = {
        ...itemToSave,
        id: generateId()
      };
      setItems([...items, newItem]);
    } else {
      setItems(items.map(item => 
        item.id === editingItemId ? { ...itemToSave, id: editingItemId } : item
      ));
      setEditingItemId(null);
    }
    
    // Reset current item
    setCurrentItem({
      categoryId: currentItem.categoryId,
      itemCode: '',
      description: '',
      unit: '',
      quantity: '',
      rate: '',
      amount: 0,
      notes: ''
    });
  };
  
  // Edit item
  const editItem = (itemId) => {
    const itemToEdit = items.find(item => item.id === itemId);
    if (itemToEdit) {
      setCurrentItem(itemToEdit);
      setEditingItemId(itemId);
    }
  };
  
  // Delete item
  const deleteItem = (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setItems(items.filter(item => item.id !== itemId));
    }
  };
  
  // Clone item
  const cloneItem = (itemId) => {
    const itemToClone = items.find(item => item.id === itemId);
    if (itemToClone) {
      const clonedItem = {
        ...itemToClone,
        id: generateId(),
        description: `${itemToClone.description} (copy)`
      };
      setItems([...items, clonedItem]);
    }
  };
  
  // Convert amount to selected currency - updated for native currency
  const formatCurrency = (amount) => {
    if (currency === 'KES') {
      return `KES ${amount.toFixed(2)}`;
    } else {
      return `$${amount.toFixed(2)}`;
    }
  };
  
  // Updated getCategoryTotal function to handle potential type mismatches
  const getCategoryTotal = (categoryId) => {
    return items
      .filter(item => parseInt(item.categoryId, 10) === parseInt(categoryId, 10))
      .reduce((sum, item) => {
        const itemAmount = parseFloat(item.amount) || 0;
        return sum + itemAmount;
      }, 0);
  };
  
  // Enhanced PDF export function
  const exportToPdf = () => {
    try {
      // Use landscape orientation for more space
      const doc = new jsPDF({ orientation: 'landscape' });
      
      // Add project information
      doc.setFontSize(18);
      doc.text('Bill of Quantities', 14, 20);
      
      doc.setFontSize(12);
      doc.text(`Project: ${projectInfo.projectName}`, 14, 30);
      doc.text(`Client: ${projectInfo.clientName}`, 14, 40);
      doc.text(`Location: ${projectInfo.projectLocation}`, 14, 50);
      doc.text(`Date: ${projectInfo.projectDate}`, 14, 60);
      doc.text(`Prepared by: ${projectInfo.preparedBy}`, 14, 70);
      doc.text(`Currency: ${currency}`, 14, 80);
      
      let currentPage = 1;
      let yPos = 90;
      
      // Calculate total number of items for progress tracking
      const totalItems = items.length;
      let itemsProcessed = 0;
      
      // Process each category
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const categoryItems = items.filter(item => parseInt(item.categoryId, 10) === parseInt(category.id, 10));
        
        // Skip empty categories
        if (categoryItems.length === 0) continue;
        
        // Check if we need a new page for this category
        if (yPos > 180) {
          doc.addPage();
          currentPage++;
          yPos = 20;
        }
        
        // Add category header
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`${category.name} (Page ${currentPage})`, 14, yPos);
        yPos += 10;
        
        // Prepare table data
        const tableData = categoryItems.map(item => [
          item.itemCode || '',
          item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description,
          item.unit,
          parseFloat(item.quantity).toFixed(2),
          currency === 'KES' ? `KES ${parseFloat(item.rate).toFixed(2)}` : `$${(parseFloat(item.rate) * exchangeRate).toFixed(2)}`,
          currency === 'KES' ? `KES ${parseFloat(item.amount).toFixed(2)}` : `$${(parseFloat(item.amount) * exchangeRate).toFixed(2)}`
        ]);
        
        // Add category total row
        tableData.push(['', '', '', '', 'Category Total:', formatCurrency(getCategoryTotal(category.id))]);
        
        // Add items table with autoTable
        doc.autoTable({
          startY: yPos,
          head: [['Item Code', 'Description', 'Unit', 'Quantity', 'Rate', 'Amount']],
          body: tableData,
          margin: { top: 10 },
          styles: { overflow: 'linebreak' },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 80 },
            2: { cellWidth: 20 },
            3: { cellWidth: 25 },
            4: { cellWidth: 35 },
            5: { cellWidth: 35 }
          },
          didDrawPage: () => {
            // Add page number
            doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
          }
        });
        
        itemsProcessed += categoryItems.length;
        yPos = doc.lastAutoTable.finalY + 15;
        
        // Add page break if needed before next category
        if (i < categories.length - 1 && yPos > 180) {
          doc.addPage();
          currentPage++;
          yPos = 20;
        }
      }
      
      // Add new page for summary
      doc.addPage();
      currentPage++;
      
      // Add summary
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`Summary (Page ${currentPage})`, 14, 20);
      
      // Add summary table
      doc.autoTable({
        startY: 30,
        head: [['Description', 'Amount']],
        body: [
          ['Direct Costs', formatCurrency(summary.directCosts)],
          [`Contingency (${summary.contingencyPercentage}%)`, formatCurrency(summary.contingency)],
          [`Overheads (${summary.overheadsPercentage}%)`, formatCurrency(summary.overheads)],
          [`Profit (${summary.profitPercentage}%)`, formatCurrency(summary.profit)],
          [`Taxes (${summary.taxRate}%)`, formatCurrency(summary.taxes)],
        ],
        foot: [
          ['Grand Total', formatCurrency(summary.grandTotal)]
        ],
        styles: { fontSize: 12 },
        margin: { top: 10 }
      });
      
      // Save the PDF with more descriptive name including date
      const today = new Date().toISOString().split('T')[0];
      doc.save(`BOQ_${projectInfo.projectName || 'Project'}_${currency}_${today}.pdf`);
      
      console.log(`Successfully exported PDF with ${itemsProcessed}/${totalItems} items`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Using fallback export method.");
      exportToPdfFallback();
    }
  };

  // Export to PDF fallback
  const exportToPdfFallback = () => {
    const doc = new jsPDF();
    
    // Add project information
    doc.setFontSize(18);
    doc.text('Bill of Quantities', 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Project: ${projectInfo.projectName}`, 14, 30);
    doc.text(`Client: ${projectInfo.clientName}`, 14, 37);
    doc.text(`Location: ${projectInfo.projectLocation}`, 14, 44);
    doc.text(`Date: ${projectInfo.projectDate}`, 14, 51);
    
    // Add simple text-based summary
    doc.text('Summary:', 14, 65);
    doc.text(`Direct Costs: ${formatCurrency(summary.directCosts)}`, 20, 75);
    doc.text(`Contingency: ${formatCurrency(summary.contingency)}`, 20, 85);
    doc.text(`Overheads: ${formatCurrency(summary.overheads)}`, 20, 95);
    doc.text(`Profit: ${formatCurrency(summary.profit)}`, 20, 105);
    doc.text(`Taxes: ${formatCurrency(summary.taxes)}`, 20, 115);
    doc.text(`Grand Total: ${formatCurrency(summary.grandTotal)}`, 20, 130);
    
    // Save the PDF
    doc.save(`BOQ_${projectInfo.projectName || 'Project'}_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  // Enhanced Excel export
  const exportToExcel = () => {
    try {
      // Create worksheet for project info with better formatting
      const projectInfoWS = XLSX.utils.json_to_sheet([
        { Name: 'Bill of Quantities', Value: '' },
        { Name: 'Project Name', Value: projectInfo.projectName },
        { Name: 'Client', Value: projectInfo.clientName },
        { Name: 'Location', Value: projectInfo.projectLocation },
        { Name: 'Date', Value: projectInfo.projectDate },
        { Name: 'Project Number', Value: projectInfo.projectNumber },
        { Name: 'Prepared By', Value: projectInfo.preparedBy },
        { Name: 'Currency', Value: currency }
      ]);
      
      // Create worksheets for each category
      const worksheets = {};
      categories.forEach(category => {
        const categoryItems = items.filter(item => parseInt(item.categoryId, 10) === parseInt(category.id, 10));
        
        if (categoryItems.length > 0) {
          // Convert items to Excel format
          const excelItems = categoryItems.map(item => ({
            'Item Code': item.itemCode,
            'Description': item.description,
            'Unit': item.unit,
            'Quantity': parseFloat(item.quantity),
            'Rate': currency === 'KES' ? parseFloat(item.rate) : parseFloat(item.rate) * exchangeRate,
            'Amount': currency === 'KES' ? parseFloat(item.amount) : parseFloat(item.amount) * exchangeRate,
            'Notes': item.notes
          }));
          
          // Create worksheet
          const ws = XLSX.utils.json_to_sheet(excelItems);
          worksheets[category.name] = ws;
        }
      });
      
      // Create summary worksheet
      const summaryData = [
        { 'Item': 'Direct Costs', 'Value': currency === 'KES' ? summary.directCosts : summary.directCosts * exchangeRate },
        { 'Item': `Contingency (${summary.contingencyPercentage}%)`, 'Value': currency === 'KES' ? summary.contingency : summary.contingency * exchangeRate },
        { 'Item': `Overheads (${summary.overheadsPercentage}%)`, 'Value': currency === 'KES' ? summary.overheads : summary.overheads * exchangeRate },
        { 'Item': `Profit (${summary.profitPercentage}%)`, 'Value': currency === 'KES' ? summary.profit : summary.profit * exchangeRate },
        { 'Item': `Taxes (${summary.taxRate}%)`, 'Value': currency === 'KES' ? summary.taxes : summary.taxes * exchangeRate },
        { 'Item': 'Grand Total', 'Value': currency === 'KES' ? summary.grandTotal : summary.grandTotal * exchangeRate }
      ];
      const summaryWS = XLSX.utils.json_to_sheet(summaryData);
      worksheets['Summary'] = summaryWS;
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, projectInfoWS, 'Project Information');
      
      // Add category worksheets
      Object.keys(worksheets).forEach(sheetName => {
        XLSX.utils.book_append_sheet(wb, worksheets[sheetName], sheetName);
      });
      
      // Save Excel file with more descriptive name including currency
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `BOQ_${projectInfo.projectName || 'Project'}_${currency}_${today}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel file:", error);
      alert("There was an error exporting to Excel. Please try again.");
    }
  };
  
  return (
    <div className="boq-generator">
      <h2>Bill of Quantities Generator</h2>
      
      {/* Currency Selection */}
      <div className="currency-selector">
        <label>Currency:</label>
        <div className="currency-buttons">
          <button 
            className={currency === 'KES' ? 'active' : ''} 
            onClick={() => {
              if (currency !== 'KES') {
                // Convert all existing items from USD to KES
                const updatedItems = items.map(item => ({
                  ...item,
                  rate: safeParseFloat((safeParseFloat(item.rate) / exchangeRate).toFixed(2)),
                  amount: safeParseFloat((safeParseFloat(item.amount) / exchangeRate).toFixed(2))
                }));
                setItems(updatedItems);
                
                // Convert current item being edited if any
                if (currentItem.rate) {
                  setCurrentItem({
                    ...currentItem,
                    rate: safeParseFloat((safeParseFloat(currentItem.rate) / exchangeRate).toFixed(2)),
                    amount: safeParseFloat((safeParseFloat(currentItem.amount) / exchangeRate).toFixed(2))
                  });
                }
                
                setCurrency('KES');
              }
            }}
          >
            KES (KSh)
          </button>
          <button 
            className={currency === 'USD' ? 'active' : ''} 
            onClick={() => {
              if (currency !== 'USD') {
                // Convert all existing items from KES to USD
                const updatedItems = items.map(item => ({
                  ...item,
                  rate: safeParseFloat((safeParseFloat(item.rate) * exchangeRate).toFixed(2)),
                  amount: safeParseFloat((safeParseFloat(item.amount) * exchangeRate).toFixed(2))
                }));
                setItems(updatedItems);
                
                // Convert current item being edited if any
                if (currentItem.rate) {
                  setCurrentItem({
                    ...currentItem,
                    rate: safeParseFloat((safeParseFloat(currentItem.rate) * exchangeRate).toFixed(2)),
                    amount: safeParseFloat((safeParseFloat(currentItem.amount) * exchangeRate).toFixed(2))
                  });
                }
                
                setCurrency('USD');
              }
            }}
          >
            USD ($)
          </button>
        </div>
        <div className="exchange-rate-info">
          Exchange Rate: 1 KES = {exchangeRate} USD
        </div>
      </div>
      
      <div className="boq-sections">
        {/* Project Information Section */}
        <div className="boq-section">
          <h3>Project Information</h3>
          <div className="project-info-grid">
            <div className="input-group">
              <label>Project Name:</label>
              <input
                type="text"
                name="projectName"
                value={projectInfo.projectName}
                onChange={handleProjectInfoChange}
              />
            </div>
            <div className="input-group">
              <label>Client Name:</label>
              <input
                type="text"
                name="clientName"
                value={projectInfo.clientName}
                onChange={handleProjectInfoChange}
              />
            </div>
            <div className="input-group">
              <label>Location:</label>
              <input
                type="text"
                name="projectLocation"
                value={projectInfo.projectLocation}
                onChange={handleProjectInfoChange}
              />
            </div>
            <div className="input-group">
              <label>Date:</label>
              <input
                type="date"
                name="projectDate"
                value={projectInfo.projectDate}
                onChange={handleProjectInfoChange}
              />
            </div>
            <div className="input-group">
              <label>Project/Contract No.:</label>
              <input
                type="text"
                name="projectNumber"
                value={projectInfo.projectNumber}
                onChange={handleProjectInfoChange}
              />
            </div>
            <div className="input-group">
              <label>Prepared By:</label>
              <input
                type="text"
                name="preparedBy"
                value={projectInfo.preparedBy}
                onChange={handleProjectInfoChange}
              />
            </div>
          </div>
        </div>
        
        {/* Categories Management */}
        <div className="boq-section">
          <h3>Work Sections/Categories</h3>
          <div className="categories-list">
            {categories.map(category => (
              <div key={category.id} className="category-item">
                <span>{category.name}</span>
                <button 
                  className="delete-button"
                  onClick={() => deleteCategory(category.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="add-category">
            <input
              type="text"
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button onClick={addCategory}>Add Category</button>
          </div>
        </div>
        
        {/* Item Entry Section */}
        <div className="boq-section">
          <h3>{editingItemId === null ? 'Add New Item' : 'Edit Item'}</h3>
          <div className="item-form">
            <div className="input-group">
              <label>Category:</label>
              <select
                name="categoryId"
                value={currentItem.categoryId}
                onChange={handleItemChange}
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label>Item Code:</label>
              <input
                type="text"
                name="itemCode"
                value={currentItem.itemCode}
                onChange={handleItemChange}
                placeholder="Optional"
              />
            </div>
            
            <div className="input-group description">
              <label>Description:</label>
              <textarea
                name="description"
                value={currentItem.description}
                onChange={handleItemChange}
                placeholder="Item description"
                rows="3"
              ></textarea>
            </div>
            
            <div className="input-group">
              <label>Unit:</label>
              <select
                name="unit"
                value={currentItem.unit}
                onChange={handleItemChange}
              >
                <option value="">Select Unit</option>
                <option value="m">m (meter)</option>
                <option value="m²">m² (square meter)</option>
                <option value="m³">m³ (cubic meter)</option>
                <option value="kg">kg (kilogram)</option>
                <option value="t">t (tonne)</option>
                <option value="nr">nr (number)</option>
                <option value="ls">ls (lump sum)</option>
                <option value="set">set</option>
                <option value="day">day</option>
                <option value="week">week</option>
                <option value="month">month</option>
              </select>
            </div>
            
            <div className="input-group">
              <label>Quantity:</label>
              <input
                type="number"
                step="0.01"
                name="quantity"
                value={currentItem.quantity}
                onChange={handleItemChange}
                placeholder="0.00"
              />
            </div>
            
            {/* Rate input */}
            <div className="input-group">
              <label>Rate ({currency === 'KES' ? 'KES' : '$'}):</label>
              <input
                type="number"
                step="0.01"
                name="rate"
                value={currentItem.rate}
                onChange={handleItemChange}
                placeholder="0.00"
              />
            </div>

            {/* Amount display */}
            <div className="input-group calculated">
              <label>Amount ({currency === 'KES' ? 'KES' : '$'}):</label>
              <div className="calculated-value">
                {currency === 'KES' 
                  ? `KES ${currentItem.amount.toFixed(2)}` 
                  : `$${(currentItem.amount * exchangeRate).toFixed(2)}`}
              </div>
            </div>
            
            <div className="input-group notes">
              <label>Notes:</label>
              <textarea
                name="notes"
                value={currentItem.notes}
                onChange={handleItemChange}
                placeholder="Additional notes (optional)"
                rows="2"
              ></textarea>
            </div>
            
            <div className="form-actions">
              <button 
                className="save-button"
                onClick={addItem}
              >
                {editingItemId === null ? 'Add Item' : 'Update Item'}
              </button>
              {editingItemId !== null && (
                <button 
                  className="cancel-button"
                  onClick={() => {
                    setEditingItemId(null);
                    setCurrentItem({
                      categoryId: 1,
                      itemCode: '',
                      description: '',
                      unit: '',
                      quantity: '',
                      rate: '',
                      amount: 0,
                      notes: ''
                    });
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Item List Section */}
        <div className="boq-section items-section">
          <h3>BOQ Items</h3>
          {categories.map(category => {
            const categoryItems = items.filter(item => item.categoryId === category.id);
            if (categoryItems.length === 0) return null;
            
            return (
              <div key={category.id} className="category-items">
                <h4>
                  {category.name}
                  <span className="category-total">
                    {formatCurrency(getCategoryTotal(category.id))}
                  </span>
                </h4>
                <div className="items-table-container">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Item Code</th>
                        <th>Description</th>
                        <th>Unit</th>
                        <th>Quantity</th>
                        <th>Rate ({currency})</th>
                        <th>Amount ({currency})</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.itemCode}</td>
                          <td>{item.description}</td>
                          <td>{item.unit}</td>
                          <td>{parseFloat(item.quantity).toFixed(2)}</td>
                          <td>{currency === 'KES' 
                            ? `KES ${parseFloat(item.rate).toFixed(2)}` 
                            : `$${(parseFloat(item.rate) * exchangeRate).toFixed(2)}`}
                          </td>
                          <td>{currency === 'KES' 
                            ? `KES ${item.amount.toFixed(2)}` 
                            : `$${(item.amount * exchangeRate).toFixed(2)}`}
                          </td>
                          <td className="actions">
                            <button 
                              className="edit-button"
                              onClick={() => editItem(item.id)}
                            >
                              Edit
                            </button>
                            <button 
                              className="clone-button"
                              onClick={() => cloneItem(item.id)}
                            >
                              Clone
                            </button>
                            <button 
                              className="delete-button"
                              onClick={() => deleteItem(item.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary Section */}
        <div className="boq-section summary-section">
          <h3>BOQ Summary</h3>
          
          <div className="summary-inputs">
            <div className="input-group">
              <label>Contingency (%):</label>
              <input 
                type="number"
                name="contingencyPercentage"
                value={summary.contingencyPercentage}
                onChange={handleSummaryChange}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
            <div className="input-group">
              <label>Overheads (%):</label>
              <input 
                type="number"
                name="overheadsPercentage"
                value={summary.overheadsPercentage}
                onChange={handleSummaryChange}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
            <div className="input-group">
              <label>Profit (%):</label>
              <input 
                type="number"
                name="profitPercentage"
                value={summary.profitPercentage}
                onChange={handleSummaryChange}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
            <div className="input-group">
              <label>Tax Rate (%):</label>
              <input 
                type="number"
                name="taxRate"
                value={summary.taxRate}
                onChange={handleSummaryChange}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
          </div>
          
          <div className="summary-table-container">
            <table className="summary-table">
              <tbody>
                <tr>
                  <td>Direct Costs:</td>
                  <td>{formatCurrency(summary.directCosts)}</td>
                </tr>
                <tr>
                  <td>Contingency ({summary.contingencyPercentage}%):</td>
                  <td>{formatCurrency(summary.contingency)}</td>
                </tr>
                <tr>
                  <td>Overheads ({summary.overheadsPercentage}%):</td>
                  <td>{formatCurrency(summary.overheads)}</td>
                </tr>
                <tr>
                  <td>Profit ({summary.profitPercentage}%):</td>
                  <td>{formatCurrency(summary.profit)}</td>
                </tr>
                <tr>
                  <td>Taxes ({summary.taxRate}%):</td>
                  <td>{formatCurrency(summary.taxes)}</td>
                </tr>
                <tr className="grand-total">
                  <td>Grand Total:</td>
                  <td>{formatCurrency(summary.grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="export-options">
            <button 
              className="export-pdf"
              onClick={() => {
                try {
                  exportToPdf();
                } catch (error) {
                  console.error("Error with PDF generation:", error);
                  exportToPdfFallback();
                }
              }}
              disabled={items.length === 0}
            >
              Export to PDF
            </button>
            <button 
              className="export-excel"
              onClick={exportToExcel}
              disabled={items.length === 0}
            >
              Export to Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillOfQuantitiesGenerator;