import { readFileSync } from 'fs';
import { join } from 'path';
import * as handlebars from 'handlebars';

export function loadTemplate(filename: string): string {
  // Ensure .hbs extension for Handlebars templates
  const templateName = filename.endsWith('.hbs')
    ? filename
    : `${filename.replace('.html', '')}.hbs`;

  // In production/dist, templates are copied to dist/notifications/templates/
  // In development, they are in src/notifications/templates/
  const isProduction = true;
  const basePath = isProduction
    ? __dirname.replace('src\\notifications', 'notifications')
    : __dirname;

  const filePath = join(basePath, 'templates', templateName);
  return readFileSync(filePath, 'utf8');
}

export function renderTemplate(
  template: string,
  variables: Record<string, any>,
): string {
  const compiledTemplate = handlebars.compile(template);
  return compiledTemplate(variables);
}
