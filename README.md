# Delivery Failure Prediction \| Supervised ML

An end-to-end **binary classification** project built to demonstrate
practical ML engineering skills, from data preparation and model
selection to validation, threshold analysis, business-cost analysis, and
model serialization.

## Problem

Predict whether a delivery will be:

-   `0` → Completed
-   `1` → Failed

The source delivery dataset contains approximately **25,000 records**.
Because it does not provide an observed delivery-failure target, this
project uses a **synthetic `delivery_status` label**. The results
therefore demonstrate the ML workflow rather than real-world delivery
performance.

## ML Workflow

``` text
Raw Data
   ↓
EDA & Data Preparation
   ↓
Target Construction
   ↓
Train / Test Split
   ↓
Leakage-Safe Preprocessing
   ↓
Baseline Models
   ↓
Cross-Validation
   ↓
Hyperparameter Tuning
   ↓
Learning-Curve Analysis
   ↓
XGBoost
   ↓
Validation Threshold & Business Analysis
   ↓
Final Test Evaluation
   ↓
Model + Threshold Saved
```

## Models Evaluated

I compared:

-   Logistic Regression
-   K-Nearest Neighbors (KNN)
-   Decision Tree
-   Random Forest
-   XGBoost

The models were evaluated using **accuracy, precision, recall, F1-score,
ROC-AUC, confusion matrices, and classification reports**.

## Model Selection & Tuning

XGBoost was tuned using **5-fold cross-validation with `GridSearchCV`**.

The tuning process explored:

-   `n_estimators`
-   `max_depth`
-   `learning_rate`
-   `subsample`

The tuned XGBoost achieved:

  Metric        Test Result
  ----------- -------------
  Accuracy           0.8982
  Precision          0.7987
  Recall             0.8268
  F1-score           0.8125
  ROC-AUC            0.9678

These results are reported at the standard **0.50 probability
threshold** for model comparison.

## Threshold & Business Analysis

A model's probability output does not automatically determine the best
decision threshold. I evaluated different thresholds on a **separate
validation set** rather than using the final test set for threshold
selection.

The threshold with the highest validation F1-score was:

**0.31**

Validation performance at this threshold:

-   Precision: **0.738**
-   Recall: **0.963**
-   F1-score: **0.835**

I also performed a **business-cost sensitivity analysis** to show how
the operating threshold can change when false positives and false
negatives have different costs.

Using illustrative assumptions:

``` text
False Positive cost = 1,000
False Negative cost = 10,000
```

the lowest estimated validation cost occurred at a threshold of
**0.15**.

This does **not** mean 0.15 is universally better. It demonstrates an
important ML engineering principle:

> **The optimal operating threshold depends on the objective and the
> real cost of different prediction errors.**

Because the project does not contain validated real-world business
costs, the final operating threshold was selected using **validation F1
= 0.31**, while the business-cost result is retained as a sensitivity
analysis.

## Data Leakage & Evaluation

The final test set is kept separate from model development:

``` text
25,000 records
│
├── 20,000 Training
│   ├── Model development
│   └── Validation / threshold selection
│
└── 5,000 Test
    └── Final evaluation only
```

The final XGBoost model is retrained using the available training data
after model and threshold selection, and the untouched test set is then
used for final evaluation.

## What I Practiced

-   Python and Pandas
-   Scikit-learn
-   XGBoost
-   Data preprocessing
-   Binary classification
-   Cross-validation
-   Hyperparameter tuning
-   Overfitting/generalization analysis
-   Probability-threshold optimization
-   Business-cost sensitivity analysis
-   Confusion-matrix analysis
-   ROC-AUC and PR-AUC
-   Feature importance
-   Model serialization with Joblib

## Project Structure

``` text
├── notebooks/
│   ├── EDA
│   ├── Preprocessing
│   ├── Baseline Models
│   ├── Model Evaluation
│   ├── Hyperparameter Tuning
│   └── Final XGBoost
│
├── models/
│   ├── preprocessor.pkl
│   └── final_xgboost_model.pkl
│
├── reports/
│   └── evaluation and model-analysis results
│
└── README.md
```

## Key Takeaway

This project focuses on the **ML engineering process**, not simply
obtaining a high accuracy score: keeping test data untouched, using
cross-validation for model selection, diagnosing generalization,
selecting an operating threshold using validation data, analyzing
business trade-offs, and saving the final model together with its
threshold for later inference.

**Tech:** Python · Pandas · NumPy · Scikit-learn · XGBoost · Matplotlib
· Joblib
