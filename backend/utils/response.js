// Success response
function successResponse(data = null, message = 'Success', statusCode = 200) {
  return {
    success: true,
    statusCode,
    message,
    data
  };
}

// Error response
function errorResponse(message = 'Error', statusCode = 500, errors = null) {
  return {
    success: false,
    statusCode,
    message,
    errors
  };
}

// Paginated response
function paginatedResponse(data, page, pageSize, total, message = 'Success') {
  return {
    success: true,
    statusCode: 200,
    message,
    data,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: parseInt(total),
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

// Send JSON response
function sendResponse(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  sendResponse
};
