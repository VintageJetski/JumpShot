# Data Upload and Processing

## Overview

JumpShot processes Counter-Strike 2 match data from CSV files. This document outlines the upload process, required data formats, potential issues, and solutions for future implementations.

## Current Data Sources

The platform currently processes data from the following sources:

1. **IEM Katowice 2025**
   - Player statistics CSV (`CS Data Points (IEM_Katowice_2025) - player_stats (IEM_Katowice_2025).csv`)
   - Round data CSV (`CS Data Points (IEM_Katowice_2025) - rounds (IEM_Katowice_2025).csv`)

2. **PGL Bucharest 2025**
   - Player statistics CSV (`CS Data Points - player_stats (PGL_Bucharest_2025).csv`)
   - Round data CSV (`CS Data Points - rounds (PGL_Bucharest_2025).csv`)

3. **Role Assignment Data**
   - Team and player role information (`CS2dkbasics - Teams and roles.csv`)

## Data Processing Pipeline

The data is processed through the following pipeline:

1. Raw CSV files are loaded from the `attached_assets` directory
2. Data is cleaned and standardized by `clean.py`
3. Core metrics are calculated by `metrics/core.py`
4. Player Impact Value (PIV) is calculated using one of several methods:
   - Simple PIV (`metrics/simple_piv.py`)
   - PIV v1.4 (`metrics/piv_v14.py`)
5. Processed data is stored for use by the web application

## Known Issues and Solutions

### Player Role Assignment Issues

**Issue**: When integrating the PGL Bucharest 2025 dataset, several players were reported as missing role information:

```
No role information found for player SH1R0, skipping
No role information found for player kaze, skipping
No role information found for player device, skipping
No role information found for player Summer, skipping
No role information found for player biguzera, skipping
No role information found for player JT, skipping
No role information found for player ICON, skipping
No role information found for player SOMEBODY, skipping
```

**Solution**: The role assignment data needs to be updated whenever new tournament data is added. Future implementations should:

1. Create an admin interface for updating player role information
2. Develop a semi-automated role assignment system based on statistical patterns
3. Implement a fallback mechanism to assign default roles when specific role information is unavailable

### CSV Format Inconsistencies

**Issue**: Different tournaments may have slight variations in CSV column names or formats, leading to parsing errors.

**Solution**: 

1. Implement a more robust column name normalization system in `clean.py`
2. Create tournament-specific parsers that can handle known format variations
3. Develop a validation step that checks new data against a schema before processing

### File Path Dependencies

**Issue**: The system currently has hardcoded file paths that need to be updated for each new dataset.

**Solution**:

1. Implement a configuration system that can be updated without code changes
2. Create a directory scanning approach to dynamically identify new data files
3. Develop a versioned data storage approach to track changes over time

## Future Data Upload System

A planned Supabase integration will improve the data upload process through:

1. **Web-Based Upload Interface**
   - Drag-and-drop functionality for CSV files
   - Schema validation before processing
   - Progress tracking during processing

2. **Automated Processing**
   - Scheduled updates from trusted data sources
   - Background processing jobs
   - Notification system for processing completion

3. **Version Control**
   - Historical data tracking
   - Ability to revert to previous datasets
   - Comparison between different tournament datasets

4. **Data Quality Management**
   - Validation rules to catch data anomalies
   - Outlier detection and flagging
   - Data completeness checking

## Implementation Timeline

- **Phase 1**: Complete integration of multiple CSV datasets (Current)
- **Phase 2**: Supabase database integration for persistent storage
- **Phase 3**: Web-based upload interface development
- **Phase 4**: Automated processing system implementation
