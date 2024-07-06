# SQL Query Structure

This package contains types and utilities for manipulating queries and their AST
representations from builders as well as native string parsing. It is broken
down into four major sections that are outlined below.

## Context

Since a query and the operations available change in response to the order of
the AST nodes themselves, a `QueryContext` object is created to track the
original schema, the current "active" schema which may contain temporary tables,
aliasing, etc. and finally the type of value being returned which may be
restricted for certain types (unions and interactions for example). The context
contains a simple builder for manipulating it programmatically as well as some
utility types for changing the shape of the `QueryContext` type to use in
compile time validation scenarios.

## Builder

This package contains types associated with building various segments of a query
AST. It is divided up into segments with related functionality to make it
easier to browse and reduce the size of files needed to be parsed or
re-inspected by the compiler during changes.

## Parser

This package deals with parsing strings into valid AST segments in much the same
way as a builder would but with the restriction that it only works for strings.
There are types for translating between a string and the varying AST Type
definitions that string represents, as well as a programmatic interface for
making those same changes to build an actual object that is bound to the type.
This is by far the most intense package for the compiler since it can generate
thousands of intermediate types while processing a larger SQL statement but
should cover a majority of use cases without issue (provided there are enough
resources available to process the required work).

## Validation

This package validates the types from an AST against a schema to ensure that all
of the tables, columns and associated operations are valid for that specific
database. When combined with the builder and parser components it can be quite
good at finding issues with a syntactically valid statement that would not run
due to schema, column or type mismatches.
