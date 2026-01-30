import { format } from 'date-fns';
import type { PRDSection, PRDStatus } from '@/types/database';

interface ExportOptions {
  title: string;
  content: string;
  sections: PRDSection[];
  status: PRDStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Export a PRD to Markdown format
 */
export function exportPRDToMarkdown({
  title,
  content,
  sections,
  status,
  createdAt,
  updatedAt,
}: ExportOptions): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${title}`);
  lines.push('');

  // Metadata
  lines.push('> **Status**: ' + formatStatus(status));
  lines.push('> **Created**: ' + format(new Date(createdAt), 'MMMM d, yyyy'));
  lines.push('> **Last Updated**: ' + format(new Date(updatedAt), 'MMMM d, yyyy'));
  lines.push('');
  lines.push('---');
  lines.push('');

  // Content - either raw content or sections
  if (content) {
    lines.push(content);
  } else if (sections && sections.length > 0) {
    sections.forEach((section) => {
      lines.push(`## ${section.title}`);
      lines.push('');
      if (section.content) {
        lines.push(section.content);
      } else {
        lines.push('*No content yet*');
      }
      lines.push('');
    });
  }

  return lines.join('\n');
}

/**
 * Format status for display
 */
function formatStatus(status: PRDStatus): string {
  const statusMap: Record<PRDStatus, string> = {
    draft: 'Draft',
    approved: 'Approved',
    in_progress: 'In Progress',
    completed: 'Completed',
  };
  return statusMap[status] || status;
}

/**
 * Parse Markdown content into sections (basic implementation)
 * This can be enhanced to parse more complex Markdown structures
 */
export function parseMarkdownToSections(content: string): PRDSection[] {
  const sections: PRDSection[] = [];
  const lines = content.split('\n');

  let currentSection: PRDSection | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    // Check for H2 headers
    const h2Match = line.match(/^## (.+)$/);

    if (h2Match) {
      // Save previous section
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        id: h2Match[1].toLowerCase().replace(/\s+/g, '-'),
        title: h2Match[1],
        content: '',
        placeholder: '',
      };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Don't forget the last section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}
