/**
 * Admin API routes module
 * 
 * This module handles admin-specific routes including the data source toggle
 */
import { Request, Response, Router } from 'express';
import { DataSource, setDataSource, refreshData } from './data-controller';

// Create an admin router
const adminRouter = Router();

// Data source toggle endpoint
adminRouter.post('/data-source', async (req: Request, res: Response) => {
  try {
    const { source } = req.body;
    console.log(`[ADMIN] Received request to switch data source to: ${source}`);
    
    if (source === 'supabase' || source === 'csv') {
      // Set the new data source
      setDataSource(source === 'supabase' ? DataSource.SUPABASE : DataSource.CSV);
      
      // Refresh player data based on the new source
      try {
        await refreshData();
        console.log(`[ADMIN] Successfully refreshed data from ${source}`);
        res.json({ 
          message: `Data source switched to ${source}`,
          timestamp: new Date().toISOString()
        });
      } catch (refreshError) {
        console.error('[ADMIN] Error refreshing data after switching source:', refreshError);
        // Still return success for the source switch, even if refresh had issues
        res.json({ 
          message: `Data source switched to ${source}`,
          warning: 'Data refresh encountered issues, some data might be stale',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      res.status(400).json({ 
        message: 'Invalid data source. Use "supabase" or "csv".',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('[ADMIN] Error switching data source:', error);
    res.status(500).json({ 
      message: 'Failed to switch data source',
      timestamp: new Date().toISOString()
    });
  }
});

// Admin statistics endpoint
adminRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get basic stats about the application
    // In a real application, you would populate this with actual data
    const stats = {
      message: "Admin stats accessed successfully",
      userCount: 1, // Admin user
      playerCount: 81, // From the data we've seen
      teamCount: 16, // From the data we've seen
      lastUpdated: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    console.error('[ADMIN] Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

// Export the router
export default adminRouter;