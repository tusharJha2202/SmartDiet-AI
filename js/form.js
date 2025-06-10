// Import configurations and prompts
import { CONFIG } from './config.js';
import { PROMPTS } from './prompts.js';

/**
 * Height conversion utility class
 */
class HeightConverter {
    static cmToFeet(cm) {
        return (cm * 0.0328084).toFixed(1);
    }

    static feetToCm(feet) {
        return Math.round(feet * 30.48);
    }
}

/**
 * Handles height input field synchronization
 */
class HeightInputHandler {
    constructor() {
        this.heightCmInput = document.getElementById('heightCm');
        this.heightFtInput = document.getElementById('heightFt');
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.heightCmInput.addEventListener('input', () => this.handleCmInput());
        this.heightFtInput.addEventListener('input', () => this.handleFtInput());
        this.heightCmInput.addEventListener('focus', () => this.clearOtherField('ft'));
        this.heightFtInput.addEventListener('focus', () => this.clearOtherField('cm'));
    }

    handleCmInput() {
        const cmValue = this.heightCmInput.value;
        this.heightFtInput.value = cmValue ? HeightConverter.cmToFeet(cmValue) : '';
    }

    handleFtInput() {
        const ftValue = this.heightFtInput.value;
        this.heightCmInput.value = ftValue ? HeightConverter.feetToCm(ftValue) : '';
    }

    clearOtherField(field) {
        if (field === 'ft' && this.heightFtInput.value) {
            this.heightFtInput.value = '';
        } else if (field === 'cm' && this.heightCmInput.value) {
            this.heightCmInput.value = '';
        }
    }
}

/**
 * Main diet plan generator class
 */
class DietPlanGenerator {
    constructor() {
        this.currentPlan = null;
        this.currentFormData = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const form = document.getElementById('dietForm');
        const modal = document.getElementById('resultModal');
        const closeBtn = document.querySelector('.close');
        const modifyBtn = document.getElementById('modifyBtn');
        const keepOriginalBtn = document.getElementById('keepOriginalBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const newPlanBtn = document.getElementById('newPlanBtn');

        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        closeBtn.addEventListener('click', () => this.closeModal());
        modifyBtn.addEventListener('click', () => this.handleModification());
        keepOriginalBtn.addEventListener('click', () => this.keepOriginalPlan());
        downloadBtn.addEventListener('click', () => this.downloadPlan());
        newPlanBtn.addEventListener('click', () => this.createNewPlan());

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = this.collectFormData();
        if (!this.validateFormData(formData)) return;

        this.currentFormData = formData;
        this.showModal();
        this.showLoading();

        try {
            const prompt = this.createPrompt(formData);
            const dietPlan = await this.callGeminiAPI(prompt);
            this.displayDietPlan(dietPlan);
            this.currentPlan = dietPlan;
        } catch (error) {
            this.handleError(error);
        }
    }

    collectFormData() {
        return {
            name: document.getElementById('name').value.trim(),
            age: parseInt(document.getElementById('age').value),
            heightCm: document.getElementById('heightCm').value,
            heightFt: document.getElementById('heightFt').value,
            weight: parseFloat(document.getElementById('weight').value),
            gender: document.querySelector('input[name="gender"]:checked')?.value,
            goal: document.getElementById('goal').value,
            budget: document.getElementById('budget').value,
            mealQty: document.getElementById('mealQty').value,
            cuisine: document.getElementById('cuisine').value,
            foodType: document.getElementById('foodtype').value,
            activity: document.getElementById('activityLevel').value,
            profession: document.getElementById('profession').value,
            preferences: document.getElementById('preferences').value.trim(),
        };
    }

    validateFormData(data) {
        const requiredFields = ['age', 'weight', 'gender', 'goal', 'budget', 'mealQty', 'foodType', 'activity'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                this.showValidationError(`Please fill in the ${field} field.`);
                return false;
            }
        }

        if (!data.heightCm && !data.heightFt) {
            this.showValidationError('Please enter your height in either cm or feet.');
            return false;
        }

        return true;
    }

    showValidationError(message) {
        alert(message); // You can replace this with a better UI notification
    }

    createPrompt(data) {
        const height = data.heightCm ? `${data.heightCm} cm` : `${data.heightFt} feet`;
        const cuisinePrefs = data.cuisine || 'Any Indian cuisine';
        const budgetRange = this.getBudgetRange(data.budget);

        // Use the prompt template from prompts.js
        return PROMPTS.DIET_PLAN_TEMPLATE
            .replace('{age}', data.age)
            .replace('{height}', height)
            .replace('{weight}', data.weight)
            .replace('{gender}', data.gender)
            .replace('{activity}', data.activity)
            .replace('{goal}', data.goal)
            .replace('{foodType}', data.foodType)
            .replace('{cuisinePrefs}', cuisinePrefs)
            .replace('{budget}', budgetRange)
            .replace('{mealQty}', data.mealQty)
            .replace('{preferences}', data.preferences || 'None mentioned');
    }

    getBudgetRange(budget) {
        const budgetMap = {
            'budget': '₹100-200',
            'moderate': '₹200-400',
            'premium': '₹400-600',
            'luxury': '₹600+'
        };
        return budgetMap[budget] || '₹200-400';
    }

    async callGeminiAPI(prompt) {
        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4096, // Increased for better formatting
            }
        };

        const response = await fetch(`${CONFIG.API_URL}?key=${CONFIG.API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response from Gemini API');
        }

        return data.candidates[0].content.parts[0].text;
    }

    async handleModification() {
        const modificationText = document.getElementById('modificationText').value.trim();
        if (!modificationText) {
            this.showValidationError('Please describe what changes you\'d like to make.');
            return;
        }

        this.showLoading();

        try {
            const modificationPrompt = PROMPTS.MODIFICATION_TEMPLATE
                .replace('{originalPlan}', this.currentPlan)
                .replace('{modifications}', modificationText);

            const modifiedPlan = await this.callGeminiAPI(modificationPrompt);
            this.displayDietPlan(modifiedPlan);
            this.currentPlan = modifiedPlan;
        } catch (error) {
            this.handleError(error);
        }
    }

    displayDietPlan(planText) {
        this.hideLoading();
        const resultDiv = document.getElementById('dietPlanResult');
        const formattedPlan = this.formatPlanText(planText);
        
        resultDiv.innerHTML = `
            <div class="diet-plan-content">
                ${formattedPlan}
            </div>
        `;
        
        document.getElementById('modificationSection').style.display = 'block';
    }

    formatPlanText(text) {
        return text
            // Convert markdown headers to HTML
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Convert bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Convert bullet points
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/^(\d+)\. (.*$)/gm, '<li class="numbered">$2</li>')
            // Wrap consecutive list items in ul tags
            .replace(/(<li>.*<\/li>)/gs, (match) => {
                if (!match.includes('<ul>')) {
                    return `<ul>${match}</ul>`;
                }
                return match;
            })
            // Convert line breaks
            .replace(/\n\n+/g, '</p><p>')
            .replace(/\n/g, '<br>')
            // Wrap in paragraph tags
            .replace(/^(?!<[hul])/gm, '<p>')
            .replace(/(?<!>)$/gm, '</p>')
            // Clean up extra tags
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<[hul])/g, '$1')
            .replace(/(<\/[hul][^>]*>)<\/p>/g, '$1');
    }

    keepOriginalPlan() {
        document.getElementById('modificationSection').style.display = 'none';
        document.getElementById('finalButtons').style.display = 'flex';
    }

    downloadPlan() {
        if (!this.currentPlan) return;

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            this.formatPDF(doc);
            doc.save(`Diet_Plan_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF generation failed:', error);
            this.showValidationError('PDF download failed. Please try again.');
        }
    }

    formatPDF(doc) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;
        const lineHeight = 7;
        let yPos = margin;

        // Add title
        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235);
        doc.text('Your Personalized Diet Plan', pageWidth / 2, yPos, { align: 'center' });
        yPos += 20;

        // Add generated date
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Process content
        doc.setFontSize(12);
        doc.setTextColor(0);

        const cleanText = this.currentPlan.replace(/\*\*/g, '').replace(/\*/g, '');
        const sections = cleanText.split('\n\n').filter(section => section.trim());
        
        sections.forEach(section => {
            const lines = section.split('\n').filter(line => line.trim());
            
            lines.forEach(line => {
                line = line.trim();
                
                if (yPos > 270) {
                    doc.addPage();
                    yPos = margin;
                }

                if (this.isHeaderLine(line)) {
                    doc.setFontSize(14);
                    doc.setFont(undefined, 'bold');
                    doc.text(line, margin, yPos);
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'normal');
                    yPos += lineHeight * 2;
                } else if (line) {
                    const splitText = doc.splitTextToSize(line, maxWidth);
                    doc.text(splitText, margin, yPos);
                    yPos += lineHeight * splitText.length;
                }
            });
            yPos += lineHeight;
        });
    }

    isHeaderLine(line) {
        return /^[🎯📅🛒💡]/.test(line) || 
               line.includes('HEALTH ANALYSIS') ||
               line.includes('MEAL PLAN') ||
               line.includes('SHOPPING LIST') ||
               line.includes('TIPS');
    }

    createNewPlan() {
        this.closeModal();
        document.getElementById('dietForm').reset();
        this.currentPlan = null;
        this.currentFormData = null;
    }

    // Modal methods
    showModal() {
        const modal = document.getElementById('resultModal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('resultModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.resetModalState();
    }

    resetModalState() {
        document.getElementById('modificationSection').style.display = 'none';
        document.getElementById('finalButtons').style.display = 'none';
        document.getElementById('modificationText').value = '';
    }

    // Loading state methods
    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('dietPlanResult').innerHTML = '';
        document.getElementById('modificationSection').style.display = 'none';
        document.getElementById('finalButtons').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    handleError(error) {
        this.hideLoading();
        console.error('Error generating diet plan:', error);
        
        const resultDiv = document.getElementById('dietPlanResult');
        resultDiv.innerHTML = `
            <div class="error-message">
                <h3>❌ Oops! Something went wrong</h3>
                <p>We couldn't generate your diet plan right now. This could be due to:</p>
                <ul>
                    <li>Network connectivity issues</li>
                    <li>High server load</li>
                    <li>API limitations</li>
                </ul>
                <p>Please try again in a few moments. If the problem persists, please contact support.</p>
                <button class="cta-button" onclick="location.reload()">Try Again</button>
            </div>
        `;
    }
}

/**
 * Multi-step form navigation handler
 */
class MultiStepForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.form = document.getElementById('dietForm');
        this.nextBtn = document.getElementById('nextBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.generateBtn = document.getElementById('generateBtn');
        this.steps = document.querySelectorAll('.form-step');
        this.stepIndicators = document.querySelectorAll('.step');
    }

    initializeEventListeners() {
        this.nextBtn.addEventListener('click', () => this.nextStep());
        this.prevBtn.addEventListener('click', () => this.prevStep());
    }

    nextStep() {
        if (this.validateCurrentStep() && this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStepDisplay();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    validateCurrentStep() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        const inputs = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        const errors = [];

        inputs.forEach(input => {
            if (input.type === 'radio') {
                const radioGroup = document.getElementsByName(input.name);
                const radioValid = Array.from(radioGroup).some(radio => radio.checked);
                if (!radioValid) {
                    isValid = false;
                    errors.push(`Please select a ${input.name} option`);
                }
            } else if (!input.value.trim()) {
                isValid = false;
                errors.push(`Please fill in ${input.getAttribute('data-label') || input.id}`);
            }
        });

        // Special validation for height in step 1
        if (this.currentStep === 1) {
            const heightCm = document.getElementById('heightCm').value;
            const heightFt = document.getElementById('heightFt').value;
            if (!heightCm && !heightFt) {
                isValid = false;
                errors.push('Please enter your height in either cm or feet');
            }
        }

        if (!isValid) {
            this.showError(errors[0]); // Show first error
        }

        return isValid;
    }

    showError(message) {
        // Remove existing error messages
        const existingErrors = document.querySelectorAll('.validation-error');
        existingErrors.forEach(error => error.remove());

        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.textContent = message;

        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        currentStepElement.appendChild(errorDiv);

        // Auto-remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    updateStepDisplay() {
        this.updateFormSteps();
        this.updateStepIndicators();
        this.updateNavigationButtons();
    }

    updateFormSteps() {
        this.steps.forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === this.currentStep);
        });
    }

    updateStepIndicators() {
        this.stepIndicators.forEach((indicator, index) => {
            indicator.classList.remove('active', 'completed');
            if (index + 1 === this.currentStep) {
                indicator.classList.add('active');
            } else if (index + 1 < this.currentStep) {
                indicator.classList.add('completed');
            }
        });
    }

    updateNavigationButtons() {
        this.prevBtn.style.display = this.currentStep === 1 ? 'none' : 'block';
        this.nextBtn.style.display = this.currentStep === this.totalSteps ? 'none' : 'block';
        this.generateBtn.style.display = this.currentStep === this.totalSteps ? 'block' : 'none';
    }
}

/**
 * Application initialization
 */
class DietPlanApp {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            new HeightInputHandler();
            new MultiStepForm();
            new DietPlanGenerator();
        });
    }
}

// Initialize the application
const app = new DietPlanApp();