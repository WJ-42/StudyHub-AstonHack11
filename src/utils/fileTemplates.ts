export interface FileTemplate {
  id: string
  name: string
  fileType: 'text' | 'csv'
  extension: string
  content: string
}

export const FILE_TEMPLATES: FileTemplate[] = [
  {
    id: 'study-notes',
    name: 'Study Notes',
    fileType: 'text',
    extension: '.md',
    content: `# Study Notes

## Date: ${new Date().toLocaleDateString()}

### Topic

### Key Points
- 
- 
- 

### Summary


### Questions
- 

`,
  },
  {
    id: 'flashcard-import',
    name: 'Flashcard Import (CSV)',
    fileType: 'csv',
    extension: '.csv',
    content: `front,back
"Question 1","Answer 1"
"Question 2","Answer 2"
"Question 3","Answer 3"
`,
  },
  {
    id: 'study-plan',
    name: 'Study Plan',
    fileType: 'text',
    extension: '.md',
    content: `# Study Plan

## Week of ${new Date().toLocaleDateString()}

### Monday
- [ ] Task 1
- [ ] Task 2

### Tuesday
- [ ] Task 1
- [ ] Task 2

### Wednesday
- [ ] Task 1
- [ ] Task 2

### Thursday
- [ ] Task 1
- [ ] Task 2

### Friday
- [ ] Task 1
- [ ] Task 2

### Weekend Review
- [ ] Review notes
- [ ] Practice problems
- [ ] Prepare for next week

`,
  },
  {
    id: 'lecture-notes',
    name: 'Lecture Notes',
    fileType: 'text',
    extension: '.md',
    content: `# Lecture Notes

**Course:** 
**Date:** ${new Date().toLocaleDateString()}
**Topic:** 

## Main Concepts


## Key Terms
- **Term 1:** Definition
- **Term 2:** Definition

## Examples


## Questions to Review


## Action Items
- [ ] 
- [ ] 

`,
  },
  {
    id: 'todo-list',
    name: 'To-Do List',
    fileType: 'text',
    extension: '.md',
    content: `# To-Do List

## ${new Date().toLocaleDateString()}

### High Priority
- [ ] 
- [ ] 

### Medium Priority
- [ ] 
- [ ] 

### Low Priority
- [ ] 
- [ ] 

### Completed
- [x] Created to-do list

`,
  },
]
