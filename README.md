# ITC Jeopardy Game

A web-based Jeopardy-style quiz game built with React and Supabase.

## Features

### Game Features
- Real-time multiplayer quiz game
- Categories with varying difficulty levels
- Points system with daily doubles
- Mobile-responsive design

### Admin Features
- Content management dashboard
- Game statistics tracking
- Database backup and restore
- Real-time monitoring

### Technical Features
- Automated database management
- Environment-specific configurations
- Production safety checks
- Backup and restore system

## Tech Stack

### Frontend
- React 18
- Vite
- React Router
- CSS3 with animations

### Backend
- Supabase
- PostgreSQL
- Real-time subscriptions
- Row-level security

## Prerequisites

### Required
- Node.js >= 16
- npm >= 8
- Supabase account

### Recommended
- PostgreSQL knowledge
- Git for version control
- Basic SQL understanding

## Setup

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-username/itc-jeopardy.git
cd itc-jeopardy

# Install dependencies
npm install

# Run interactive setup
npm run setup
```

### Manual Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
3. Configure environment variables in `.env`:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_ACCESS_TOKEN=your_access_token
   ```
4. Initialize database:
   ```bash
   npm run db:migrate   # Apply schema
   npm run db:seed     # Load test data
   ```
5. Start development:
   ```bash
   npm run dev        # Start server
   npm run db:watch  # Monitor changes
   ```

### Environment Setup

Choose the appropriate setup for your needs:
```bash
npm run setup:dev   # Development environment
npm run setup:prod  # Production environment
```

### Database Management

```bash
# Development Operations
npm run db:migrate        # Apply migrations
npm run db:seed          # Load test data
npm run db:reset         # Reset database
npm run db:watch         # Monitor changes

# Backup Management
npm run db:backup:create # Create backup
npm run db:backup:list  # List backups
npm run db:backup:clean # Clean old backups
npm run db:backup:restore # Restore backup

# Production Operations
npm run db:migrate:prod  # Production migration
npm run db:backup:prod   # Production backup
npm run db:restore:prod  # Production restore
```

## Project Structure

```
itc-jeopardy/
├── src/
│   ├── components/        # React components
│   │   ├── admin/        # Admin dashboard components
│   │   └── ...
│   ├── database/         # Database setup and migrations
│   ├── styles/           # CSS stylesheets
│   ├── utils/           # Utility functions
│   └── data/            # Static data and constants
├── public/              # Static assets
└── ...
```

## Features

### Game Play
- Two-player game
- Categories with questions worth 200-1000 points
- Daily Double questions for bonus points
- Timer for each question
- Score tracking

### Admin Dashboard
- Category management
- Question management
- Game statistics
- Performance analytics

### User Interface
- Clean, modern design
- Responsive layout
- Animated transitions
- Loading states
- Error handling

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Deploying to GitHub Pages

#### Using GitHub Actions (Recommended)
The project is configured to automatically deploy to GitHub Pages using GitHub Actions. When you push to the main branch, the workflow will build and deploy the app.

1. Set up GitHub Pages in your repository settings:
   - Go to Settings > Pages
   - Set the source to "GitHub Actions"

2. Add the required secrets to your repository:
   - Go to Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

3. Push to the main branch or manually trigger the workflow:
   - Go to Actions > Deploy to GitHub Pages > Run workflow

#### Manual Deployment
You can also deploy manually using the npm script:
```bash
npm run deploy
```

### Troubleshooting Deployment Issues

If you encounter issues with Supabase connectivity in your deployed app:

1. Verify that the GitHub secrets are correctly set
2. Check the browser console for any errors
3. Ensure your Supabase project allows requests from your GitHub Pages domain
4. If needed, rebuild and redeploy the app

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Game Rules

1. Players take turns selecting questions
2. Each question has a time limit
3. Incorrect answers deduct points
4. Daily Doubles allow wagering
5. Game ends when all questions are answered

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- ITC Staff and Students
- Jeopardy! for inspiration
- React and Supabase communities

## Support

For support, please open an issue in the repository or contact the development team.

## Database Management Guide

### Backup and Recovery

#### Creating Backups
```bash
# Manual backup
npm run db:backup:create

# List existing backups
npm run db:backup:list

# Clean up old backups (keeps last 5 by default)
npm run db:backup:clean 5
```

#### Restoring from Backup
```bash
# List available backups first
npm run db:backup:list

# Restore from specific backup
npm run db:backup:restore backup-2025-02-25T12-00-00.json
```

### Monitoring and Maintenance

#### Real-time Monitoring
```bash
# Start the database watcher
npm run db:watch

# Monitor with automatic refresh
DB_WATCH_INTERVAL=30000 npm run db:watch
```

#### Database Statistics
- View table record counts
- Monitor changes in real-time
- Track user activity
- Analyze game performance

### Production Safety Features

- Automatic backups before risky operations
- Production environment detection
- Confirmation prompts for dangerous actions
- Timeout protection for long-running operations

### Environment Configuration

#### Required Variables
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### Optional Variables
```env
SUPABASE_ACCESS_TOKEN=admin_access_token
SUPABASE_DB_PASSWORD=database_password
DB_AUTO_RESET=false
DB_BACKUP_ENABLED=true
DB_BACKUP_PATH=./backups
DB_SCRIPT_TIMEOUT=30000
DB_WATCH_INTERVAL=60000
```

### Common Operations

#### Reset Database
```bash
# Development reset
npm run db:reset

# Reset with seed data
npm run db:reset-with-seed

# Production reset (requires confirmation)
NODE_ENV=production npm run db:reset
```

#### Database Migration
```bash
# Development migration
npm run db:migrate

# Production migration
npm run db:migrate:prod
```

### Troubleshooting

1. Connection Issues
   ```bash
   # Verify connection
   npm run setup -- --verify
   ```

2. Permission Problems
   - Check Supabase access token
   - Verify RLS policies
   - Ensure proper role assignments

3. Data Sync Issues
   ```bash
   # Force refresh
   npm run db:reset
   npm run db:seed
   ```

4. Backup Failures
   - Check disk space
   - Verify backup directory permissions
   - Ensure database connectivity

### Best Practices

1. Regular Backups
   - Schedule daily backups
   - Keep multiple backup copies
   - Test restore procedures

2. Monitoring
   - Watch for unusual activity
   - Monitor performance metrics
   - Check error logs

3. Updates
   - Test migrations in development
   - Backup before updating
   - Document changes

4. Security
   - Use strong passwords
   - Enable RLS policies
   - Regularly rotate keys

For more detailed information about the database schema and management tools, see the [Database Documentation](src/database/README.md).
