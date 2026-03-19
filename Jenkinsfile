pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds(abortPrevious: true)
    }

    stages {
        stage('Checkout Confirm') {
            steps {
                echo "Jenkins checkout test start"
                sh 'pwd'
                sh 'ls -al'
                sh 'git branch --show-current || true'
                sh 'git rev-parse --abbrev-ref HEAD || true'
            }
        }

        stage('Project Structure Check') {
            steps {
                sh 'test -d DOCK-BE'
                sh 'test -d DOCK-FE'
                sh 'echo "DOCK-BE and DOCK-FE directories found"'
            }
        }
    }

    post {
        success {
            echo 'Jenkinsfile execution success'
        }
        failure {
            echo 'Jenkinsfile execution failed'
        }
    }
}
